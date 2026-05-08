const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { validatePasswordStrength } = require('../utils/passwordPolicy');
const { logRoleChange, logAccountStatusChange, getClientIp, getUserAgent } = require('../services/auditService');

/**
 * List all users.
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, username, email, role, created_at, status, last_login FROM admins ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new user.
 * POST /api/admin/users
 */
const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Role check: Force all new users to be 'Admin'
    const finalRole = 'Admin';

    const { ok, errors } = validatePasswordStrength(password);
    if (!ok) {
      return res.status(422).json({ message: errors[0], errors });
    }

    const hash = await bcrypt.hash(password, 10);

    try {
      const [result] = await db.execute(
        'INSERT INTO admins (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        [username.trim(), email.trim().toLowerCase(), hash, finalRole, 'active']
      );

      // Audit log
      try {
        await db.execute(
          'INSERT INTO audit_logs (user_id, action_type, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'CREATE', 'User Management', result.insertId, JSON.stringify({ username, email, role: finalRole, status: 'active' })]
        );
      } catch (logErr) { console.error('Audit log failed:', logErr); }

      res.status(201).json({
        id: result.insertId,
        username,
        email,
        role: finalRole,
        status: 'active',
        message: 'User created successfully'
      });
    } catch (dbErr) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Username or email already exists' });
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing user.
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, status } = req.body;

    if (!username || !email || !role || !status) {
      return res.status(400).json({ message: 'Username, email, role, and status are required' });
    }

    // 1. Fetch current user data to check permissions
    const [currentRows] = await db.execute('SELECT id, username, email, role, status FROM admins WHERE id = ?', [id]);
    if (currentRows.length === 0) return res.status(404).json({ message: 'User not found' });
    const targetUser = currentRows[0];

    // 2. Role-based security checks
    const isSuperAdmin = req.user.role === 'SuperAdmin';
    const isTargetSuperAdmin = targetUser.role === 'SuperAdmin';

    // Force role to remain 'Admin' for non-superadmins, or preserve SuperAdmin status
    const finalRole = isTargetSuperAdmin ? 'SuperAdmin' : 'Admin';

    if (!isSuperAdmin && isTargetSuperAdmin) {
      return res.status(403).json({ message: 'Only the SuperAdmin can modify the SuperAdmin account' });
    }

    let sql = 'UPDATE admins SET username = ?, email = ?, role = ?, status = ?';
    const params = [username.trim(), email.trim().toLowerCase(), finalRole, status];

    if (password && password.trim() !== '') {
      const { ok, errors } = validatePasswordStrength(password);
      if (!ok) {
        return res.status(422).json({ message: errors[0], errors });
      }
      const hash = await bcrypt.hash(password, 10);
      sql += ', password = ?';
      params.push(hash);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    try {
      const [result] = await db.execute(sql, params);
      
      // Log role change separately if role changed
      if (targetUser.role !== finalRole) {
        await logRoleChange(
          req.user.id,
          id,
          targetUser.role,
          finalRole,
          'Role updated via admin panel',
          getClientIp(req),
          getUserAgent(req)
        );
      }
      
      // Log status change separately if status changed
      if (targetUser.status !== status) {
        await logAccountStatusChange(
          req.user.id,
          id,
          targetUser.status,
          status,
          'Status updated via admin panel',
          getClientIp(req),
          getUserAgent(req)
        );
      }

      res.json({ message: 'User updated successfully' });
    } catch (dbErr) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Username or email already exists' });
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle user status (Activate/Deactivate).
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    // 1. Fetch current user data
    const [rows] = await db.execute('SELECT id, role, status FROM admins WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const targetUser = rows[0];

    // 2. Permission check
    const isSuperAdmin = req.user.role === 'SuperAdmin';
    const isTargetSuperAdmin = targetUser.role === 'SuperAdmin';
    if (!isSuperAdmin && isTargetSuperAdmin) {
      return res.status(403).json({ message: 'Only the SuperAdmin can deactivate the SuperAdmin account' });
    }

    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    await db.execute('UPDATE admins SET status = ? WHERE id = ?', [newStatus, id]);

    // Log account status change
    await logAccountStatusChange(
      req.user.id,
      id,
      targetUser.status,
      newStatus,
      `Account ${newStatus === 'active' ? 'reactivated' : 'deactivated'} via admin panel`,
      getClientIp(req),
      getUserAgent(req)
    );

    res.json({ message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
