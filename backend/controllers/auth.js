const db = require('../config/db');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/security');
const { validatePasswordStrength } = require('../utils/passwordPolicy');
const attemptService = require('../services/loginAttemptService');
const {
  selectAdminByUsername,
  selectAdminById,
  updateAdminPasswordAndClearMustChange,
  setAdminMustChangePassword,
} = require('../utils/adminQuery');
const { logAuthEvent, clientIp } = require('../services/authAudit');
const {
  logLogin,
  logLogout,
  getClientIp,
  getUserAgent,
  logSessionTimeout,
  logCriticalError,
  logUpdate,
  calculateDiff,
  logAuditEvent,
} = require('../services/auditService');
const { sendRecoveryEmail } = require('../services/recoveryMail');
const crypto = require('crypto');

const MAX_PASSWORD_LENGTH = 72;

let attemptsTableAvailable = true;

async function probeAttemptsTable() {
  try {
    await db.execute('SELECT 1 FROM login_attempts LIMIT 1');
    attemptsTableAvailable = true;
  } catch (e) {
    attemptsTableAvailable = false;
    console.warn('[auth] login_attempts unavailable; run database/auth_login_security.sql —', e.code || e.message);
  }
}
probeAttemptsTable();

function buildPayload(admin, mustFlag) {
  return {
    sub: admin.id,
    id: admin.id,
    username: admin.username,
    role: admin.role || 'Editor',
    mustChangePassword: Boolean(mustFlag === true || Number(admin.must_change_password) === 1),
    principal: 'admins',
  };
}

function signJwt(admin, mustFlag) {
  return jwt.sign(buildPayload(admin, mustFlag), getJwtSecret(), { expiresIn: '8h' });
}

function signJwtFromPayload(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '8h' });
}

exports.login = async (req, res, next) => {
  try {
    const rawUser = req.body.username;
    const password = req.body.password;
    const username = typeof rawUser === 'string' ? rawUser.trim() : '';

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const rows = await selectAdminByUsername(username);
    const ip = clientIp(req);

    if (!rows.length) {
      await logAuthEvent(`LOGIN_FAIL unknown_user=${username}`, { adminId: null, ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = rows[0];
    const depedEmail = admin.email && String(admin.email).trim() !== '' ? String(admin.email).trim() : null;

    if (attemptsTableAvailable) {
      const gate = await attemptService.checkLoginAllowed(admin.id);
      console.log('[DEBUG] checkLoginAllowed result for', admin.username, ':', JSON.stringify(gate));
      if (!gate.allowed && gate.code === 'BLOCKED') {
        await logAuthEvent('LOGIN_REJECTED_ACCOUNT_BLOCKED', { adminId: admin.id, ip });
        return res.status(403).json({
          code: 'ACCOUNT_BLOCKED',
          message:
            'Your account is blocked. Use your recovery link sent to your registered email. If none arrived, contact ICT to unlock your account.',
        });
      }
      if (!gate.allowed && gate.code === 'LOCKED') {
        await logAuthEvent('LOGIN_REJECTED_TEMP_LOCK', { adminId: admin.id, ip });
        return res.status(429).json({
          code: 'LOGIN_LOCKED',
          message: attemptService.lockMessage(gate.row?.attempt_count || 3),
          retryAfterSeconds: gate.retryAfterSeconds,
        });
      }
    }

    const hash = admin.password;
    if (!hash || typeof hash !== 'string') {
      await logAuthEvent('LOGIN_FAIL_NO_PASSWORD_HASH', { adminId: admin.id, ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, hash);
    console.log('[DEBUG] Password check for', admin.username, ':', ok);
    if (!ok) {
      // Log failed login to audit system
      await logLogin(admin.id, getClientIp(req), getUserAgent(req), false);
      
      if (attemptsTableAvailable) {
        try {
          const fail = await attemptService.recordFailedAttempt(
            admin.id,
            depedEmail,
            admin.username,
            ip
          );
          if (fail.blocked) {
            await logAuthEvent('LOGIN_REJECTED_ACCOUNT_BLOCKED', { adminId: admin.id, ip });
            let blockedMessage = 'Your account is blocked. Please contact ICT for assistance.';
            if (fail.recoverySent) {
              blockedMessage =
                'Your account is blocked. A recovery link was sent to your registered recovery email.';
            } else if (fail.recoveryReason === 'NO_EMAIL_ON_FILE' || !depedEmail) {
              blockedMessage =
                'Your account is blocked. No recovery email is on file. Please contact ICT.';
            } else if (fail.recoveryReason === 'MAIL_NOT_CONFIGURED') {
              blockedMessage =
                'Your account is blocked. Recovery email service is not configured yet. Please contact ICT.';
            } else if (fail.recoveryReason === 'MAIL_SEND_FAILED') {
              blockedMessage =
                'Your account is blocked. We could not deliver the recovery email. Please contact ICT.';
            }
            return res.status(403).json({
              code: 'ACCOUNT_BLOCKED',
              message: blockedMessage,
            });
          }
          if (fail.attemptCount === 3) {
            return res.status(429).json({
              code: 'LOGIN_LOCKED',
              message: 'Too many attempts. Please wait 2 minutes.',
              retryAfterSeconds: 120,
            });
          }
          if (fail.attemptCount === 4) {
            return res.status(429).json({
              code: 'LOGIN_LOCKED',
              message: 'Too many attempts. Please wait 5 minutes.',
              retryAfterSeconds: 300,
            });
          }
        } catch (trackErr) {
          console.error(trackErr);
        }
      } else {
        await logAuthEvent('LOGIN_FAIL_WRONG_PASSWORD no_attempt_tracking', { adminId: admin.id, ip });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (attemptsTableAvailable) {
      try {
        await attemptService.resetAttempts(admin.id);
        await logAuthEvent('LOGIN_ATTEMPTS_RESET_AFTER_SUCCESS', { adminId: admin.id, ip });
      } catch (e) {
        /* ignore */
      }
    }

    await logAuthEvent('LOGIN_SUCCESS', { adminId: admin.id, ip });

    // Log to audit system
    await logLogin(admin.id, getClientIp(req), getUserAgent(req), true);

    try {
      await db.execute('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);
    } catch (updateErr) {
      console.warn('Could not update admins.last_login:', updateErr.message);
    }

    const mustChange = Number(admin.must_change_password) === 1;
    let token;
    try {
      token = signJwt(admin, mustChange);
    } catch (configErr) {
      console.error(configErr);
      return res.status(500).json({ message: 'Authentication service misconfigured' });
    }

    // Set HttpOnly, Secure cookie (8 hours expiration)
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
      path: '/',
    });

    res.json({
      token: token,
      expiresIn: '8h',
      mustChangePassword: mustChange,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role || 'Editor',
        email: depedEmail || undefined,
        full_name: admin.full_name || undefined,
        avatar: admin.avatar_url || undefined,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Exchange one-time recovery token for JWT (must change password). */
exports.consumeRecovery = async (req, res, next) => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    const rIp = clientIp(req);
    if (!token || token.length !== 64) {
      await logAuthEvent('RECOVERY_TOKEN_REJECTED invalid_format', { adminId: null, ip: rIp });
      return res.status(400).json({ message: 'Invalid recovery token' });
    }

    const [rows] = await db.execute(
      'SELECT * FROM login_recovery WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
      [token]
    );
    if (!rows.length) {
      await logAuthEvent('RECOVERY_TOKEN_REJECTED invalid_or_expired', { adminId: null, ip: rIp });
      return res.status(400).json({ message: 'Invalid or expired recovery link' });
    }
    const rec = rows[0];

    await db.execute('UPDATE login_recovery SET used = 1 WHERE id = ?', [rec.id]);
    await setAdminMustChangePassword(rec.admin_id, 1);
    if (attemptsTableAvailable) {
      await attemptService.resetAttempts(rec.admin_id);
    }
    await logAuthEvent('RECOVERY_TOKEN_CONSUMED', { adminId: rec.admin_id, ip: rIp });

    const admins = await selectAdminById(rec.admin_id);
    if (!admins.length) {
      return res.status(400).json({ message: 'Account not found' });
    }
    const admin = admins[0];
    admin.must_change_password = 1;

    let jwtToken;
    try {
      jwtToken = signJwt(admin, true);
    } catch (e) {
      return next(e);
    }

    res.json({
      token: jwtToken,
      mustChangePassword: true,
      message: 'Choose a new password to continue.',
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;
    const mustChange = req.user.mustChangePassword === true;
    const principal = req.user.principal || 'admins';

    const { ok, errors } = validatePasswordStrength(newPassword);
    if (!ok) {
      return res.status(422).json({ message: errors[0] || 'Password does not meet policy', errors });
    }

    if (principal === 'users') {
      const [urows] = await db.execute(
        'SELECT id, username, password, email, role FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      if (!urows.length) return res.status(404).json({ message: 'Account not found' });
      const u = urows[0];
      if (u.role !== 'admin') {
        return res.status(403).json({ message: 'Not allowed' });
      }
      if (!mustChange) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required' });
        }
        const match = await bcrypt.compare(currentPassword, u.password);
        if (!match) return res.status(401).json({ message: 'Current password is incorrect' });
      }
      const newHash = await bcrypt.hash(newPassword, 10);
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, userId]);
      await logAuthEvent('PASSWORD_CHANGED users_table', { adminId: null, ip: clientIp(req) });
      const payload = buildUsersAdminPayload({ ...u, password: newHash });
      const token = signJwtFromPayload(payload);
      return res.json({
        token,
        mustChangePassword: false,
        message: 'Password updated',
        user: {
          id: u.id,
          username: u.username,
          role: 'admin',
        },
      });
    }

    const rows = await selectAdminById(userId);
    if (!rows.length) return res.status(404).json({ message: 'Account not found' });
    const admin = rows[0];

    if (!mustChange) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const match = await bcrypt.compare(currentPassword, admin.password);
      if (!match) return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await updateAdminPasswordAndClearMustChange(userId, newHash);

    await logAuthEvent('PASSWORD_CHANGED', { adminId: userId, ip: clientIp(req) });

    admin.must_change_password = 0;
    const token = signJwt(admin, false);

    // Set updated token in cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      token,
      mustChangePassword: false,
      message: 'Password updated',
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role || 'Editor',
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    
    // Log logout event to audit system
    if (userId) {
      await logLogout(userId, getClientIp(req), getUserAgent(req));
    }
    
    // Clear authentication cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    res.status(204).send();
  } catch (err) {
    // Don't fail the logout if audit logging fails
    console.error('[auth.logout] Audit logging error:', err.message);
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.status(204).send();
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const principal = req.user.principal || 'admins';

    if (principal === 'users') {
      const [rows] = await db.execute(
        'SELECT id, username, email, role FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      if (!rows.length) return res.status(404).json({ message: 'User not found' });
      return res.json(rows[0]);
    }

    const [rows] = await db.execute(
      'SELECT id, username, email, role, full_name, avatar_url AS avatar, must_change_password FROM admins WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Admin not found' });
    const a = rows[0];
    res.json({
      id: a.id,
      username: a.username,
      email: a.email,
      role: a.role,
      full_name: a.full_name,
      avatar: a.avatar,
      mustChangePassword: Number(a.must_change_password) === 1,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const principal = req.user.principal || 'admins';
    
    const body = req.body || {};
    const { full_name, email, avatar } = body;

    if (principal === 'users') {
      const [current] = await db.execute('SELECT email FROM users WHERE id = ?', [userId]);
      if (!current.length) return res.status(404).json({ message: 'User not found' });
      const user = current[0];
      const nextEmail = email !== undefined ? email : user.email;
      const oldValue = { email: user.email };
      const newValue = { email: nextEmail };

      await db.execute('UPDATE users SET email = ? WHERE id = ?', [nextEmail, userId]);

      try {
        const diff = calculateDiff(oldValue, newValue);
        if (diff.added || Object.keys(diff.modified || {}).length || diff.removed) {
          await logUpdate(
            userId,
            'account',
            oldValue,
            newValue,
            userId,
            'user_profile',
            diff,
            'Updated account email',
            getClientIp(req),
            getUserAgent(req)
          );
        }
      } catch (e) {
        /* audit must not block profile save */
      }
    } else {
      const [current] = await db.execute('SELECT full_name, email, avatar_url FROM admins WHERE id = ?', [userId]);
      if (!current.length) return res.status(404).json({ message: 'Admin not found' });
      const admin = current[0];
      const nextFull = full_name !== undefined ? full_name : admin.full_name;
      const nextEmail = email !== undefined ? email : admin.email;
      const nextAvatar = avatar !== undefined ? avatar : admin.avatar_url;
      const oldValue = {
        full_name: admin.full_name,
        email: admin.email,
        avatar_url: admin.avatar_url,
      };
      const newValue = {
        full_name: nextFull,
        email: nextEmail,
        avatar_url: nextAvatar,
      };

      await db.execute(
        'UPDATE admins SET full_name = ?, email = ?, avatar_url = ? WHERE id = ?',
        [nextFull, nextEmail, nextAvatar, userId]
      );

      try {
        const diff = calculateDiff(oldValue, newValue);
        if (Object.keys(diff.modified || {}).length || diff.added || diff.removed) {
          await logUpdate(
            userId,
            'account',
            oldValue,
            newValue,
            userId,
            'admin_profile',
            diff,
            'Updated staff profile (name, email, or photo)',
            getClientIp(req),
            getUserAgent(req)
          );
        }
      } catch (e) {
        /* audit must not block profile save */
      }
    }

    const [updated] = await db.execute(
      principal === 'users' 
        ? 'SELECT id, username, email, role FROM users WHERE id = ?'
        : 'SELECT id, username, email, role, full_name, avatar_url as avatar FROM admins WHERE id = ?',
      [userId]
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: updated[0]
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    next(err);
  }
};

/**
 * Avatar Upload — multipart handled by multer in routes/auth.js (field name: avatar)
 * Returns: { message, avatarUrl }
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const fs = require('fs');
    const path = require('path');

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update database
    const [current] = await db.execute(
      'SELECT avatar_url FROM admins WHERE id = ?',
      [userId]
    );

    if (!current.length) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Delete old avatar file if it exists
    if (current[0].avatar_url) {
      const oldPath = path.join(__dirname, '..', current[0].avatar_url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update avatar_url in database
    await db.execute(
      'UPDATE admins SET avatar_url = ? WHERE id = ?',
      [avatarUrl, userId]
    );

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SuperAdmin-only: send a real recovery email to the currently signed-in admin.
 * This creates a token row in login_recovery so the link is usable.
 */
exports.sendTestRecoveryEmail = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Login required' });

    const rows = await selectAdminById(userId);
    if (!rows.length) return res.status(404).json({ message: 'Account not found' });

    const admin = rows[0];
    const email = admin.email && String(admin.email).trim() ? String(admin.email).trim() : null;
    if (!email) {
      return res.status(422).json({ message: 'No recovery email is saved in your profile.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    try {
      await db.execute(
        'INSERT INTO login_recovery (admin_id, email, token, expires_at, used) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)',
        [admin.id, email, token, 15]
      );
    } catch (e) {
      return res.status(500).json({
        message: 'Recovery table is missing. Please run the login security migration.',
      });
    }

    const result = await sendRecoveryEmail({ to: email, token, username: admin.username });
    if (!result.sent) {
      return res.status(500).json({
        message:
          result.reason === 'MAIL_NOT_CONFIGURED'
            ? 'Recovery email service is not configured yet.'
            : 'Could not send the recovery email. Please check mail settings.',
      });
    }

    try {
      await logAuditEvent({
        userId: admin.id,
        action: 'MAINTENANCE_TASK',
        status: 'SUCCESS',
        module: 'auth',
        description: `Sent a test recovery email to ${email}`,
        recordId: 'recovery_test',
        resourceType: 'recovery_email',
        newValue: { email },
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });
    } catch {
      // do not block
    }

    return res.json({ message: `Test recovery email sent to ${email}.` });
  } catch (err) {
    next(err);
  }
};
