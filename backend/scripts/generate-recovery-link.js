const db = require('../config/db');
const crypto = require('crypto');

(async () => {
  try {
    console.log('📋 Setting up account recovery system...\n');

    // 1. Create login_recovery table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS login_recovery (
        id int(11) NOT NULL AUTO_INCREMENT,
        admin_id int(11) NOT NULL,
        token varchar(64) NOT NULL UNIQUE,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        expires_at datetime NOT NULL,
        used tinyint(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ login_recovery table created/verified');

    // 2. Create login_attempts table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id int(11) NOT NULL AUTO_INCREMENT,
        admin_id int(11) NOT NULL,
        email varchar(100) NOT NULL,
        attempt_count int(11) NOT NULL DEFAULT 0,
        last_attempt_time datetime DEFAULT NULL,
        lock_until datetime DEFAULT NULL,
        is_blocked tinyint(1) NOT NULL DEFAULT 0,
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY uq_login_attempts_admin (admin_id),
        CONSTRAINT fk_login_attempts_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ login_attempts table created/verified\n');

    // 3. Get the superadmin account
    const [admins] = await db.execute(
      'SELECT id, username, email, must_change_password FROM admins WHERE role = ? OR username = ? LIMIT 1',
      ['SuperAdmin', 'admin_main']
    );

    if (!admins.length) {
      console.error('✗ No superadmin or admin_main found');
      process.exit(1);
    }

    const admin = admins[0];
    console.log(`📧 Admin: ${admin.username} (ID: ${admin.id})`);
    console.log(`   Email: ${admin.email || '(not set)'}`);
    console.log(`   Forced password change: ${admin.must_change_password ? 'Yes' : 'No'}\n`);

    // 4. Ensure email is set (required for recovery)
    if (!admin.email) {
      console.log('⚠️  Email not set. Setting default DepEd email...');
      await db.execute(
        'UPDATE admins SET email = ? WHERE id = ?',
        ['admin@deped.gov.ph', admin.id]
      );
      console.log('✓ Email set to: admin@deped.gov.ph\n');
    }

    // 5. Clear login block and attempts
    console.log('🔓 Clearing account block...');
    await db.execute(
      'DELETE FROM login_attempts WHERE admin_id = ?',
      [admin.id]
    );
    console.log('✓ Login block cleared\n');

    // 6. Generate recovery token (valid for 15 minutes)
    console.log('🔑 Generating recovery token...');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.execute(
      'INSERT INTO login_recovery (admin_id, token, expires_at) VALUES (?, ?, ?)',
      [admin.id, token, expiresAt]
    );
    console.log('✓ Recovery token generated\n');

    // 7. Construct recovery link
    const frontendOrigin = process.env.FRONTEND_ORIGIN?.split(',')[0] || 'http://localhost:5173';
    const recoveryUrl = `${frontendOrigin}/admin/reset-access?token=${token}`;

    console.log('━'.repeat(70));
    console.log('✅ RECOVERY LINK READY\n');
    console.log('📋 Copy and paste this link into your browser:\n');
    console.log(recoveryUrl);
    console.log('\n⏱️  Valid for: 15 minutes\n');
    console.log('━'.repeat(70));
    console.log('\n📝 Steps to regain access:');
    console.log('1. Open the link above in your browser');
    console.log('2. Set a new password (8-12 chars: uppercase, lowercase, number, special char)');
    console.log('3. You\'ll be logged in - dashboard access is immediate\n');

    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
