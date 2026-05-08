const crypto = require('crypto');
const db = require('../config/db');
const { sendRecoveryEmail } = require('./recoveryMail');
const { logAuthEvent } = require('./authAudit');
const { logAuditEvent, getClientIp } = require('./auditService');

const RECOVERY_TTL_MIN = 15;

async function getOrCreateAttempts(adminId, emailFallback) {
  const [rows] = await db.execute('SELECT * FROM login_attempts WHERE admin_id = ? LIMIT 1', [
    adminId,
  ]);
  if (rows.length) {
    const r = rows[0];
    if (emailFallback && r.email !== emailFallback) {
      await db.execute('UPDATE login_attempts SET email = ? WHERE admin_id = ?', [
        emailFallback,
        adminId,
      ]);
      r.email = emailFallback;
    }
    return r;
  }
  const ef = emailFallback || 'unknown@deped.gov.ph';
  await db.execute(
    'INSERT INTO login_attempts (admin_id, email, attempt_count, last_attempt_time) VALUES (?, ?, 0, NOW())',
    [adminId, ef]
  );
  const [again] = await db.execute('SELECT * FROM login_attempts WHERE admin_id = ? LIMIT 1', [
    adminId,
  ]);
  return again[0];
}

async function resetAttempts(adminId) {
  await db.execute(
    `UPDATE login_attempts
     SET attempt_count = 0, lock_until = NULL, is_blocked = 0, last_attempt_time = NOW()
     WHERE admin_id = ?`,
    [adminId]
  );
}

/**
 * @returns {Promise<{ blocked: boolean, lockUntil: Date|null, attemptCount: number, recoverySent?: boolean, recoveryReason?: string|null }>}
 */
async function recordFailedAttempt(adminId, email, username, reqIp = null) {
  const row = await getOrCreateAttempts(adminId, email || null);
  const count = (row.attempt_count || 0) + 1;

  let lockFragment = 'lock_until = NULL';
  if (count === 3) lockFragment = 'lock_until = DATE_ADD(NOW(), INTERVAL 2 MINUTE)';
  else if (count === 4) lockFragment = 'lock_until = DATE_ADD(NOW(), INTERVAL 5 MINUTE)';
  else if (count >= 5) lockFragment = 'lock_until = NULL';

  const isBlocked = count >= 5 ? 1 : 0;
  const em = email || row.email;

  await db.execute(
    `UPDATE login_attempts
     SET attempt_count = ?, last_attempt_time = NOW(), ${lockFragment}, is_blocked = GREATEST(is_blocked, ?), email = COALESCE(NULLIF(?, ''), email)
     WHERE admin_id = ?`,
    [count, isBlocked, em || null, adminId]
  );

  let recoverySent = false;
  let recoveryReason = null;
  if (count >= 5 && em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      await db.execute(
        'INSERT INTO login_recovery (admin_id, email, token, expires_at, used) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)',
        [adminId, em, token, RECOVERY_TTL_MIN]
      );
      const result = await sendRecoveryEmail({ to: em, token, username });
      recoverySent = result.sent === true;
      recoveryReason = result.reason || null;
    } catch (err) {
      console.error('Recovery token/email failed (ensure login_recovery table exists):', err.message);
      recoveryReason = 'MAIL_FLOW_ERROR';
    }
  } else if (count >= 5 && !em) {
    recoveryReason = 'NO_EMAIL_ON_FILE';
  } else if (count >= 5) {
    recoveryReason = 'INVALID_EMAIL_ON_FILE';
  }

  const ctx = { adminId, ip: reqIp || null };
  await logAuthEvent(`LOGIN_FAIL count=${count} user=${username || 'n/a'}`, ctx);
  if (count === 3) await logAuthEvent('LOCKOUT_2MIN_APPLIED', ctx);
  if (count === 4) await logAuthEvent('LOCKOUT_5MIN_APPLIED', ctx);
  if (count >= 5) {
    await logAuthEvent(
      `ACCOUNT_BLOCKED recovery_email=${recoverySent ? 'sent' : 'skipped_or_failed'}`,
      ctx
    );
    // Log account lockout to Phase 1 audit system
    try {
      await logAuditEvent({
        userId: null,
        action: 'ACCOUNT_LOCKOUT',
        status: 'FAILED',
        module: 'auth',
        description: `Account locked after 5 failed login attempts. Recovery email ${recoverySent ? 'sent' : 'not sent'}`,
        resourceType: 'user_account',
        resourceId: adminId,
        newValue: {
          locked: true,
          reason: 'excessive_failed_attempts',
          recovery_sent: recoverySent,
          recovery_reason: recoveryReason || null
        },
        ipAddress: reqIp || null
      });
    } catch (auditErr) {
      console.error('[loginAttemptService] Failed to log account lockout:', auditErr.message);
    }
  }

  return {
    blocked: count >= 5,
    lockUntil: count >= 5 ? null : count === 3 || count === 4 ? 'db' : null,
    attemptCount: count,
    recoverySent,
    recoveryReason,
  };
}

async function checkLoginAllowed(adminId) {
  const [rows] = await db.execute('SELECT * FROM login_attempts WHERE admin_id = ? LIMIT 1', [
    adminId,
  ]);
  if (!rows.length) {
    return { allowed: true, row: null };
  }
  const row = rows[0];
  const now = Date.now();

  if (row.is_blocked) {
    return {
      allowed: false,
      code: 'BLOCKED',
      retryAfterSeconds: null,
      row,
    };
  }

  if (row.lock_until) {
    const until = new Date(row.lock_until).getTime();
    if (until > now) {
      return {
        allowed: false,
        code: 'LOCKED',
        retryAfterSeconds: Math.ceil((until - now) / 1000),
        attemptCount: row.attempt_count || 0,
        row,
      };
    }
  }

  return { allowed: true, row };
}

function lockMessage(attemptCount) {
  if (attemptCount >= 4) return 'Too many attempts. Please wait 5 minutes.';
  if (attemptCount >= 3) return 'Too many attempts. Please wait 2 minutes.';
  return 'Too many attempts. Please try again later.';
}

module.exports = {
  getOrCreateAttempts,
  resetAttempts,
  recordFailedAttempt,
  checkLoginAllowed,
  lockMessage,
  RECOVERY_TTL_MIN,
};
