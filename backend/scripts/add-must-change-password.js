const db = require('../config/db');

(async () => {
  try {
    console.log('Adding must_change_password column to admins table...');
    await db.execute(`
      ALTER TABLE admins 
      ADD COLUMN IF NOT EXISTS must_change_password tinyint(1) NOT NULL DEFAULT 0
    `);
    console.log('✓ Column added/verified');
    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
