const bcrypt = require('bcryptjs');
const db = require('../config/db');
const attemptService = require('../services/loginAttemptService');

(async () => {
  try {
    console.log('=== Testing Full Login Flow ===\n');

    const username = 'admin_main';
    const password = '@dmin!Main20';

    // Get admin
    const [admins] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);
    if (!admins.length) {
      console.log('Admin not found');
      process.exit(1);
    }
    const admin = admins[0];
    console.log('Admin:', admin.username, '(' + admin.id + ')');
    console.log('Password hash exists:', !!admin.password);

    // Test password
    if (!admin.password) {
      console.log('✗ NO PASSWORD HASH');
      process.exit(1);
    }

    const match = await bcrypt.compare(password, admin.password);
    console.log('Password match:', match);

    if (match) {
      console.log('✓ Password is CORRECT - login should succeed');
    } else {
      console.log('✗ Password is WRONG - will trigger recordFailedAttempt');
      
      // Simulate failed attempt
      const fail = await attemptService.recordFailedAttempt(
        admin.id,
        admin.email || 'unknown@deped.gov.ph',
        admin.username,
        '127.0.0.1'
      );
      console.log('\nFailed attempt result:');
      console.log(JSON.stringify(fail,null, 2));
      
      if (fail.blocked) {
        console.log('\n✗ Account would be BLOCKED');
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
