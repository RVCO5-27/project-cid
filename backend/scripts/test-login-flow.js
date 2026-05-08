const db = require('../config/db');
const attemptService = require('../services/loginAttemptService');

(async () => {
  try {
    console.log('=== Testing Login Flow for admin_main ===\n');

    // Step 1: Get admin
    const [admins] = await db.execute('SELECT * FROM admins WHERE username = ?', ['admin_main']);
    if (!admins.length) {
      console.log('Admin not found');
      process.exit(1);
    }
    const admin = admins[0];
    console.log('✓ Admin found:', admin.username);

    // Step 2: Check if table available
    let tableAvailable = true;
    try {
      await db.execute('SELECT 1 FROM login_attempts LIMIT 1');
      console.log('✓ login_attempts table available');
    } catch (e) {
      tableAvailable = false;
      console.log('✗ login_attempts table NOT available');
    }

    // Step 3: Check login allowed
    if (tableAvailable) {
      console.log('\nChecking login allowed for admin_id:', admin.id);
      const gate = await attemptService.checkLoginAllowed(admin.id);
      console.log('Gate response:', JSON.stringify(gate, null, 2));
      
      if (!gate.allowed && gate.code === 'BLOCKED') {
        console.log('\n✗ Account is BLOCKED');
      } else if (!gate.allowed && gate.code === 'LOCKED') {
        console.log('\n⏱ Account is LOCKED (temp)');
      } else if (gate.allowed) {
        console.log('\n✓ Login is ALLOWED');
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
