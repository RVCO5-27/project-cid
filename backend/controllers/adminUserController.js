const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { validatePasswordStrength } = require('../utils/passwordPolicy');
const { logCreate, logUpdate, logDelete, logRoleChange, logAccountStatusChange, calculateDiff, getClientIp, getUserAgent } = require('../services/auditService');

/**
 * List all users.
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, username, email, role, created_at FROM admins ORDER BY created_at DESC'
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

    const { ok, errors } = validatePasswordStrength(password);
    if (!ok) {
      return res.status(422).json({ message: errors[0], errors });
    }

    const hash = await bcrypt.hash(password, 10);

    try {
      const [result] = await db.execute(
        'INSERT INTO admins (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username.trim(), email.trim().toLowerCase(), hash, role]
      );
      
      const userId = result.insertId;
      const newUserData = { username, email, role };
      
      // Log user creation
      await logCreate(
        req.user.id,
        'users',
        newUserData,
        userId,
        'admin',
        `Created admin user: ${username}`,
        getClientIp(req),
        getUserAgent(req)
      );
      
      res.status(201).json({
        id: userId,
        username,
        email,
        role,
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
    const { username, email, password, role } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ message: 'Username, email, and role are required' });
    }

    // Get old user data for audit log
    const [[oldUser]] = await db.execute(
      'SELECT id, username, email, role FROM admins WHERE id = ?',
      [id]
    );

    let sql = 'UPDATE admins SET username = ?, email = ?, role = ?';
    const params = [username.trim(), email.trim().toLowerCase(), role];

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
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Log user update
      const updatedData = { username, email, role };
      const diff = calculateDiff(oldUser, updatedData);
      await logUpdate(
        req.user.id,
        'users',
        oldUser,
        updatedData,
        id,
        'admin',
        diff,
        `Updated admin user: ${username}`,
        getClientIp(req),
        getUserAgent(req)
      );
      
      // Log role change separately if role changed
      if (oldUser.role !== role) {
        await logRoleChange(
          req.user.id,
          id,
          oldUser.role,
          role,
          'Role updated via admin panel',
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
 * Delete a user.
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Get user data for audit log
    const [[user]] = await db.execute(
      'SELECT id, username, email, role FROM admins WHERE id = ?',
      [id]
    );

    const [result] = await db.execute('DELETE FROM admins WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log user deletion
    await logDelete(
      req.user.id,
      'users',
      user,
      id,
      'admin',
      `Deleted admin user: ${user?.username}`,
      getClientIp(req),
      getUserAgent(req)
    );
    
    res.json({ message: 'User deleted successfully' });
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
