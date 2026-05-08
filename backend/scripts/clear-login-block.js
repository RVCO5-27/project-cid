const db = require('../config/db');

(async () => {
  try {
    // Create login_attempts table if it doesn't exist
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
    console.log('✓ login_attempts table created/verified');

    // Make sure email column exists on admins table
    try {
      await db.execute(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS email varchar(100)`);
      console.log('✓ email column added to admins table');
    } catch (err) {
      // Column might already exist
    }

    // Get admin_main id
    const [admins] = await db.execute(
      'SELECT id FROM admins WHERE username = ?',
      ['admin_main']
    );
    
    if (!admins.length) {
      console.error('✗ admin_main not found');
      process.exit(1);
    }

    const adminId = admins[0].id;
    const email = 'admin@deped.gov.ph'; // Default email

    // Clear login attempts for admin_main
    const [result] = await db.execute(
      `UPDATE login_attempts 
       SET attempt_count = 0, lock_until = NULL, is_blocked = 0 
       WHERE admin_id = ?`,
      [adminId]
    );

    if (result.affectedRows === 0) {
      // No record exists, create one with clean state
      await db.execute(
        `INSERT INTO login_attempts (admin_id, email, attempt_count, is_blocked, last_attempt_time) 
         VALUES (?, ?, 0, 0, NOW())`,
        [adminId, email]
      );
      console.log('✓ Created clean login_attempts record for admin_main');
    } else {
      console.log('✓ Reset login attempts for admin_main');
    }

    console.log('✓ Account is now unblocked!');
    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
