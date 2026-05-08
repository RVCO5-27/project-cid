const db = require('../config/db');

(async () => {
  try {
    // Add status column if it doesn't exist
    await db.execute(`
      ALTER TABLE admins 
      ADD COLUMN IF NOT EXISTS status enum('active','inactive','suspended') DEFAULT 'active'
    `);
    console.log('✓ Status column verified');

    // Set admin_main to active
    const [result] = await db.execute(
      'UPDATE admins SET status = ? WHERE username = ?',
      ['active', 'admin_main']
    );
    console.log('✓ admin_main status set to active');
    console.log('  Rows affected:', result.affectedRows);

    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
