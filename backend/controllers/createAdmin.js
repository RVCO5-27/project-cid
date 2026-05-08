const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { validateBootstrapPassword } = require('../utils/passwordPolicy');

const MAX_PASSWORD_LENGTH = 72;

async function isBootstrapAvailable() {
  try {
    const [admRows] = await db.execute('SELECT id FROM admins LIMIT 1');
    return admRows.length === 0;
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE') return false;
    throw e;
  }
}

/** GET /api/create-admin/status — for SPA: hide route when setup is done */
exports.status = async (req, res, next) => {
  try {
    const available = await isBootstrapAvailable();
    res.json({ available });
  } catch (err) {
    next(err);
  }
};

/**
 * Bootstrap: create the first admin in `users` only when no admin exists yet.
 * Also blocks when legacy `admins` rows exist so the system is not double-bootstrapped.
 */
exports.createAdmin = async (req, res, next) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;

    if (!username || !email || password == null || password === '') {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ message: 'Password is too long' });
    }

    const { ok, errors } = validateBootstrapPassword(password);
    if (!ok) {
      return res.status(422).json({
        message: errors[0] || 'Password does not meet policy',
        errors,
      });
    }

    if (!(await isBootstrapAvailable())) {
      return res.status(403).json({ message: 'Admin account already exists. Sign in to your dashboard instead.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const role = 'SuperAdmin'; // Ensure bootstrap account is SuperAdmin

    try {
      const [result] = await db.execute(
        'INSERT INTO admins (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hash, role]
      );
      return res.status(201).json({
        message: 'Admin account created successfully',
        user: { id: result.insertId, username, email, role },
      });
    } catch (insertErr) {
      if (insertErr.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Username or email is already taken' });
      }
      if (insertErr.code === 'ER_NO_SUCH_TABLE') {
        return res.status(503).json({
          message: 'Database is not ready: create the `admins` table (see database/shs.sql).',
        });
      }
      if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(503).json({
          message:
            'The `admins` table does not match the expected schema. Apply `database/shs.sql` (admins section).',
        });
      }
      throw insertErr;
    }
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(503).json({
        message: 'Database is not ready: create the `admins` table (see database/shs.sql).',
      });
    }
    next(err);
  }
};
