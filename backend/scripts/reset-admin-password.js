const db = require('../config/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const newPassword = 'TempPass123!'; // Temporary password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [result] = await db.execute(
      'UPDATE admins SET password = ?, must_change_password = 1 WHERE username = ?',
      [hashedPassword, 'admin_main']
    );

    if (result.affectedRows === 0) {
      console.error('❌ Admin not found');
      process.exit(1);
    }

    console.log('✅ Password reset successfully!');
    console.log(`📧 Username: admin_main`);
    console.log(`🔐 Temporary password: ${newPassword}`);
    console.log('\n⚠️  You must change this password after first login.');
    console.log('\nLogin with these credentials:');
    console.log(`  Username: admin_main`);
    console.log(`  Password: ${newPassword}`);

    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
