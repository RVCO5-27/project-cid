const db = require('../config/db');

(async () => {
  try {
    console.log('🔍 Checking admin accounts...\n');

    // Check all admins
    const [admins] = await db.execute('SELECT id, username, email, role, status FROM admins');
    
    console.log(`📋 Total admin accounts: ${admins.length}\n`);
    
    if (!admins.length) {
      console.log('❌ NO ADMIN ACCOUNTS FOUND!\n');
      console.log('Need to create admin_main...\n');
      process.exit(1);
    }

    admins.forEach(a => {
      console.log(`  ID: ${a.id}`);
      console.log(`  Username: ${a.username}`);
      console.log(`  Email: ${a.email}`);
      console.log(`  Role: ${a.role}`);
      console.log(`  Status: ${a.status}\n`);
    });

    // Specifically check for admin_main
    const [adminMain] = await db.execute(
      'SELECT * FROM admins WHERE username = ? OR id = 1',
      ['admin_main']
    );

    if (!adminMain.length) {
      console.log('❌ admin_main not found!');
      process.exit(1);
    }

    console.log('✅ admin_main found with ID:', adminMain[0].id);
    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
