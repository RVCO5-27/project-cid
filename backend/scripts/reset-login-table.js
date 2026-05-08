const db = require('../config/db');

(async () => {
  try {
    console.log('Dropping login_attempts table if exists...');
    await db.execute('DROP TABLE IF EXISTS login_attempts');
    console.log('✓ Dropped');

    console.log('Creating fresh login_attempts table...');
    await db.execute(`
      CREATE TABLE login_attempts (
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
    console.log('✓ Login attempts table recreated');

    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
