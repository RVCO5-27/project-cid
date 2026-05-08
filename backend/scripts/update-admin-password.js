const db = require('../config/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const password = 'Admin@2026!';
    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'UPDATE admins SET password = ?, must_change_password = 1 WHERE username = ?',
      [hash, 'admin_main']
    );

    if (result.affectedRows === 0) {
      console.error('✗ Admin not found');
      process.exit(1);
    }

    console.log('✅ Password updated successfully!');
    console.log(`📧 Username: admin_main`);
    console.log(`🔐 Password: ${password}`);
    console.log(`🔒 Hash: ${hash}`);
    console.log('\n⚠️  You must change password after login.');
    console.log('\nCredentials for testing:');
    console.log(`  Username: admin_main`);
    console.log(`  Password: ${password}`);

    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
