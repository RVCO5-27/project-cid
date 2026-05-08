const db = require('../config/db');

const username = process.argv[2] || 'admin_main';

(async () => {
  try {
    const [admin] = await db.execute('SELECT id FROM admins WHERE username = ?', [username]);
    
    if (!admin.length) {
      console.log('Admin not found:', username);
      process.exit(1);
    }

    const adminId = admin[0].id;

    const [rows] = await db.execute('SELECT * FROM login_attempts WHERE admin_id = ?', [adminId]);
    console.log('Current lock status:', rows);

    const [result] = await db.execute('DELETE FROM login_attempts WHERE admin_id = ?', [adminId]);
    console.log('Block cleared for', username, '- rows deleted:', result.affectedRows);
    
    process.exit(0);
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  }
})();
