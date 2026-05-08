const db = require('../config/db');

(async () => {
  try {
    // Check recovery tokens for admin_main
    const [recovery] = await db.execute(
      `SELECT id, admin_id, token, created_at, expires_at, used 
       FROM login_recovery 
       WHERE admin_id = 1 
       ORDER BY created_at DESC 
       LIMIT 3`
    );

    console.log('📋 Recovery tokens in database:\n');
    if (!recovery.length) {
      console.log('❌ No recovery tokens found');
      process.exit(1);
    }

    recovery.forEach((rec, i) => {
      const now = new Date();
      const expiresAt = new Date(rec.expires_at);
      const isExpired = expiresAt < now;
      const isUsed = rec.used === 1;
      
      console.log(`${i + 1}. Token: ${rec.token}`);
      console.log(`   Used: ${isUsed ? '✓ YES' : '✗ NO'}`);
      console.log(`   Expires at: ${rec.expires_at}`);
      console.log(`   Expired: ${isExpired ? '✓ YES' : '✗ NO'}`);
      console.log(`   Valid: ${!isExpired && !isUsed ? '✅ YES' : '❌ NO'}\n`);
    });

    // Get latest valid token
    const validToken = recovery.find(r => {
      const expiresAt = new Date(r.expires_at);
      return r.used === 0 && expiresAt > new Date();
    });

    if (!validToken) {
      console.log('❌ No valid (unused/non-expired) tokens found\n');
    } else {
      console.log(`✅ Latest valid token: ${validToken.token}\n`);
      const frontendOrigin = process.env.FRONTEND_ORIGIN?.split(',')[0] || 'http://localhost:5173';
      console.log(`Recovery URL: ${frontendOrigin}/admin/reset-access?token=${validToken.token}\n`);
    }

    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
