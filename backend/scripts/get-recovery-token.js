const db = require('../config/db');

(async () => {
  try {
    // Get admin_main (usually the superadmin)
    const [admins] = await db.execute(
      'SELECT id, username, email FROM admins WHERE username = ? OR role = ?',
      ['admin_main', 'superadmin']
    );
    
    if (!admins.length) {
      console.error('✗ No superadmin or admin_main found');
      process.exit(1);
    }

    console.log('\n📋 Admin accounts found:');
    admins.forEach(a => {
      console.log(`  - ID: ${a.id}, Username: ${a.username}, Email: ${a.email}`);
    });

    const admin = admins[0];
    console.log(`\n🔍 Checking recovery tokens for: ${admin.username} (ID: ${admin.id})\n`);

    // Check login_recovery table
    const [recovery] = await db.execute(
      'SELECT id, token, admin_id, created_at, expires_at, used FROM login_recovery WHERE admin_id = ? ORDER BY created_at DESC LIMIT 5',
      [admin.id]
    );

    if (!recovery.length) {
      console.log('❌ No recovery tokens found for this account.');
      console.log('\nℹ️  To generate a recovery token:');
      console.log('   1. Make sure your DepEd email is set on the admin record');
      console.log('   2. Attempt login with wrong password 5+ times to trigger block');
      console.log('   3. Check email for recovery link\n');
      
      // Check if email is set
      const [emailCheck] = await db.execute(
        'SELECT email FROM admins WHERE id = ?',
        [admin.id]
      );
      console.log(`📧 Current email on record: ${emailCheck[0]?.email || '(not set)'}\n`);
      process.exit(1);
    }

    console.log('✅ Recovery tokens found:\n');
    recovery.forEach((rec, i) => {
      const isUsed = rec.used === 1 ? ' ✓ USED' : ' (VALID)';
      const isExpired = new Date(rec.expires_at) < new Date() ? ' ⏰ EXPIRED' : '';
      console.log(`${i + 1}. Token: ${rec.token}`);
      console.log(`   Status:${isUsed}${isExpired}`);
      console.log(`   Created: ${rec.created_at}\n`);
    });

    // Find the latest valid (unused, not expired) token
    const validToken = recovery.find(r => r.used === 0 && new Date(r.expires_at) > new Date());
    
    if (validToken) {
      console.log('🔗 RECOVERY LINK:\n');
      const raw = process.env.FRONTEND_APP_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
      const frontendOrigin = String(raw).split(',')[0].trim().replace(/\/+$/, '');
      const url = `${frontendOrigin}/admin/reset-access?token=${validToken.token}`;
      console.log(url);
      console.log('\n👇 Copy the link above and open it in your browser.\n');
    } else {
      console.log('❌ No valid recovery tokens (all are expired or already used).\n');
    }

    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
