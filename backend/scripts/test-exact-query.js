const db = require('../config/db');

(async () => {
  try {
    const token = '2bd5089addbca54f0c198d84fa7c42b79b8426cd061e6243104120daaf70f95c';
    
    console.log('🔍 Testing exact backend query...\n');

    // Exact query from the backend
    const [rows] = await db.execute(
      'SELECT * FROM login_recovery WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
      [token]
    );

    console.log(`QueryResult: ${rows.length} row(s)\n`);
    
    if (rows.length) {
      console.log('✅ Token found!');
      console.log(JSON.stringify(rows[0], null, 2));
    } else {
      console.log('❌ Token not found or expired');
      
      // Debug each condition
      console.log('\n📋 Debug info:');
      const [all] = await db.execute('SELECT * FROM login_recovery WHERE token = ?', [token]);
      console.log(`  Token exists: ${all.length > 0}`);
      
      if (all.length) {
        const rec = all[0];
        console.log(`  Token: ${rec.token}`);
        console.log(`  Used: ${rec.used} (should be 0)`);
        console.log(`  Expires at: ${rec.expires_at}`);
        console.log(`  Now: ${new Date().toISOString()}`);
        console.log(`  Expired: ${rec.expires_at <= new Date()}`);
      }
    }
    
    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
