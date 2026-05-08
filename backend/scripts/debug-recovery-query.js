const db = require('../config/db');

(async () => {
  try {
    const token = '775b8362a3244d92670d2f897f3d1e5b0f6532b8fdfee77a5a410569d355d641';
    
    console.log('🔍 Debugging recovery endpoint query...\n');
    console.log(`Testing token: ${token}\n`);

    // Test 1: Find token directly
    console.log('Test 1: Find token in database');
    const [test1] = await db.execute(
      'SELECT * FROM login_recovery WHERE token = ?',
      [token]
    );
    console.log(`Found: ${test1.length} row(s)`);
    if (test1.length) {
      console.log(JSON.stringify(test1[0], null, 2));
    }
    console.log('');

    // Test 2: Check if used = 0
    console.log('Test 2: Find unused tokens');
    const [test2] = await db.execute(
      'SELECT token, used FROM login_recovery WHERE used = 0 LIMIT 3'
    );
    console.log(`Found: ${test2.length} unused token(s)`);
    test2.forEach(t => console.log(`  Token: ${t.token}, Used: ${t.used}`));
    console.log('');

    // Test 3: Check expiration
    console.log('Test 3: Find non-expired tokens');
    const [test3] = await db.execute(
      'SELECT token, expires_at, expires_at > NOW() as is_valid FROM login_recovery ORDER BY created_at DESC LIMIT 3'
    );
    console.log(`Found: ${test3.length} token(s)`);
    test3.forEach(t => console.log(`  Token: ${t.token}, Valid: ${t.is_valid}`));
    console.log('');

    // Test 4: Full query
    console.log('Test 4: Full recovery query');
    const [test4] = await db.execute(
      'SELECT * FROM login_recovery WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
      [token]
    );
    console.log(`Found: ${test4.length} row(s)`);
    if (test4.length) {
      console.log(JSON.stringify(test4[0], null, 2));
    } else {
      console.log('❌ Query returned no results!');
      
      // Debug why
      const [debug] = await db.execute(
        `SELECT 
          token,
          (token = ?) as token_matches,
          used,
          (used = 0) as is_unused,
          expires_at,
          expires_at > NOW() as is_not_expired
        FROM login_recovery 
        WHERE token = ?`,
        [token, token]
      );
      if (debug.length) {
        console.log('\nDebug info:');
        console.log(JSON.stringify(debug[0], null, 2));
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
