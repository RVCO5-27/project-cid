const db = require('../config/db');

function normalizeAdminRow(row) {
  if (!row) return row;
  return {
    ...row,
    email: row.email !== undefined ? row.email : null,
    must_change_password:
      row.must_change_password !== undefined && row.must_change_password !== null
        ? row.must_change_password
        : 0,
  };
}

async function selectAdminByUsername(username) {
  try {
    const [rows] = await db.execute(
      'SELECT id, username, password, role, email, must_change_password FROM admins WHERE username = ? LIMIT 1',
      [username]
    );
    return rows.map(normalizeAdminRow);
  } catch (e) {
    if (e.code !== 'ER_BAD_FIELD_ERROR') throw e;
    const [rows] = await db.execute(
      'SELECT id, username, password, role FROM admins WHERE username = ? LIMIT 1',
      [username]
    );
    return rows.map((r) => normalizeAdminRow({ ...r, email: null, must_change_password: 0 }));
  }
}

async function selectAdminById(id) {
  try {
    const [rows] = await db.execute(
      'SELECT id, username, password, role, email, must_change_password FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.map(normalizeAdminRow);
  } catch (e) {
    if (e.code !== 'ER_BAD_FIELD_ERROR') throw e;
    const [rows] = await db.execute(
      'SELECT id, username, password, role FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.map((r) => normalizeAdminRow({ ...r, email: null, must_change_password: 0 }));
  }
}

async function updateAdminPasswordAndClearMustChange(userId, hash) {
  try {
    await db.execute('UPDATE admins SET password = ?, must_change_password = 0 WHERE id = ?', [
      hash,
      userId,
    ]);
  } catch (e) {
    if (e.code !== 'ER_BAD_FIELD_ERROR') throw e;
    await db.execute('UPDATE admins SET password = ? WHERE id = ?', [hash, userId]);
  }
}

async function setAdminMustChangePassword(adminId, flag = 1) {
  try {
    await db.execute('UPDATE admins SET must_change_password = ? WHERE id = ?', [flag, adminId]);
  } catch (e) {
    if (e.code !== 'ER_BAD_FIELD_ERROR') throw e;
    /* column missing — skip */
  }
}

module.exports = {
  selectAdminByUsername,
  selectAdminById,
  updateAdminPasswordAndClearMustChange,
  setAdminMustChangePassword,
};
