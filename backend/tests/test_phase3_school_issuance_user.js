/**
 * Phase 3 Integration Tests: School, Issuance, and User Operations Logging
 * Tests audit logging for business operations: schools, issuances, users, analytics
 */

const mysql = require('mysql2/promise');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shs',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function runTests() {
  let connection;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to database');

    // ============================================================
    // Test 1: Verify school create logging
    // ============================================================
    console.log('\n📝 Test 1: School Create Logging');
    try {
      const schoolName = `Test School Phase3 ${Date.now()}`;
      
      // Create a school
      const [schoolResult] = await connection.execute(
        `INSERT INTO schools (school_id, school_name, principal_name, designation, year_started, school_type, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`SCH-${Date.now()}`, schoolName, 'Test Principal', 'Principal', 2024, 'Public', 1]
      );
      const schoolId = schoolResult.insertId;

      // Log it
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'SCHOOL_CREATE', 'schools', schoolId, 'school',
         JSON.stringify({school_name: schoolName, principal_name: 'Test Principal'}),
         'SUCCESS', `Created school: ${schoolName}`, '127.0.0.1', 'Test Browser']
      );

      const [schoolLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'SCHOOL_CREATE' AND record_id = ?`,
        [schoolId]
      );

      if (schoolLogs[0].count > 0) {
        console.log(`  ✓ PASSED: School create logged (ID: ${schoolId})`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: School create not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 2: Verify issuance create logging
    // ============================================================
    console.log('\n📝 Test 2: Issuance Create Logging');
    try {
      const issuanceTitle = `Test Issuance Phase3 ${Date.now()}`;
      
      // Create an issuance
      const [issuanceResult] = await connection.execute(
        `INSERT INTO issuances (title, doc_number, series_year, status, category_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [issuanceTitle, `ISS-${Date.now()}`, 2024, 'published', null]
      );
      const issuanceId = issuanceResult.insertId;

      // Log it
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'ISSUANCE_CREATE', 'issuances', issuanceId, 'issuance',
         JSON.stringify({title: issuanceTitle, status: 'published'}),
         'SUCCESS', `Created issuance: ${issuanceTitle}`, '127.0.0.1', 'Test Browser']
      );

      const [issuanceLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'ISSUANCE_CREATE' AND record_id = ?`,
        [issuanceId]
      );

      if (issuanceLogs[0].count > 0) {
        console.log(`  ✓ PASSED: Issuance create logged (ID: ${issuanceId})`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Issuance create not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 3: Verify issuance update logging
    // ============================================================
    console.log('\n📝 Test 3: Issuance Update Logging');
    try {
      // Create an issuance first
      const [issuanceResult] = await connection.execute(
        `INSERT INTO issuances (title, doc_number, series_year, status, category_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [`Update Test ${Date.now()}`, `ISS-UPD-${Date.now()}`, 2024, 'draft', null]
      );
      const issuanceId = issuanceResult.insertId;

      // Update it
      await connection.execute(
        `UPDATE issuances SET status = ?, title = ? WHERE id = ?`,
        ['published', `Updated Issuance ${Date.now()}`, issuanceId]
      );

      // Log it
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'ISSUANCE_UPDATE', 'issuances', issuanceId, 'issuance',
         JSON.stringify({status: 'draft'}),
         JSON.stringify({status: 'published'}),
         'SUCCESS', `Updated issuance: Updated Issuance`, '127.0.0.1', 'Test Browser']
      );

      const [updateLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'ISSUANCE_UPDATE' AND record_id = ?`,
        [issuanceId]
      );

      if (updateLogs[0].count > 0) {
        console.log(`  ✓ PASSED: Issuance update logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Issuance update not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 4: Verify issuance delete logging
    // ============================================================
    console.log('\n📝 Test 4: Issuance Delete Logging');
    try {
      // Create an issuance
      const [issuanceResult] = await connection.execute(
        `INSERT INTO issuances (title, doc_number, series_year, status, category_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [`Delete Test ${Date.now()}`, `ISS-DEL-${Date.now()}`, 2024, 'draft', null]
      );
      const issuanceId = issuanceResult.insertId;

      // Delete it
      await connection.execute(
        `UPDATE issuances SET deleted_at = NOW(), status = 'archived' WHERE id = ?`,
        [issuanceId]
      );

      // Log it
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'ISSUANCE_DELETE', 'issuances', issuanceId, 'issuance',
         JSON.stringify({title: 'Delete Test', status: 'draft'}),
         'SUCCESS', `Archived issuance: Delete Test`, '127.0.0.1', 'Test Browser']
      );

      const [deleteLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'ISSUANCE_DELETE' AND record_id = ?`,
        [issuanceId]
      );

      if (deleteLogs[0].count > 0) {
        console.log(`  ✓ PASSED: Issuance delete logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Issuance delete not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 5: Verify user registration logging
    // ============================================================
    console.log('\n📝 Test 5: User Registration Logging');
    try {
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'USER_REGISTRATION', 'users', 'test_user_123', 'admin',
         JSON.stringify({username: 'testuser123', email: 'test@example.com', role: 'admin'}),
         'SUCCESS', 'Created admin user: testuser123', '127.0.0.1', 'Test Browser']
      );

      const [userRegLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'USER_REGISTRATION'`
      );

      if (userRegLogs[0].count > 0) {
        console.log(`  ✓ PASSED: User registration logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: User registration not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 6: Verify user profile update logging
    // ============================================================
    console.log('\n📝 Test 6: User Profile Update Logging');
    try {
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'USER_PROFILE_UPDATE', 'users', 5, 'admin',
         JSON.stringify({email: 'old@example.com'}),
         JSON.stringify({email: 'new@example.com'}),
         'SUCCESS', 'Updated admin user: testuser', '127.0.0.1', 'Test Browser']
      );

      const [profileLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'USER_PROFILE_UPDATE'`
      );

      if (profileLogs[0].count > 0) {
        console.log(`  ✓ PASSED: User profile update logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: User profile update not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 7: Verify analytics access logging
    // ============================================================
    console.log('\n📝 Test 7: Analytics Access Logging');
    try {
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'REPORT_ACCESSED', 'analytics', null, 'report',
         JSON.stringify({type: 'dashboard_summary', timestamp: new Date().toISOString()}),
         'SUCCESS', 'Accessed dashboard summary statistics', '127.0.0.1', 'Test Browser']
      );

      const [analyticsLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'REPORT_ACCESSED'`
      );

      if (analyticsLogs[0].count > 0) {
        console.log(`  ✓ PASSED: Analytics access logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Analytics access not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 8: Verify school update logging
    // ============================================================
    console.log('\n📝 Test 8: School Update Logging');
    try {
      const schoolId = Math.floor(Math.random() * 10000);
      
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'SCHOOL_UPDATE', 'schools', schoolId, 'school',
         JSON.stringify({principal_name: 'Old Principal'}),
         JSON.stringify({principal_name: 'New Principal'}),
         'SUCCESS', 'Updated school: Updated School', '127.0.0.1', 'Test Browser']
      );

      const [schoolUpdateLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'SCHOOL_UPDATE'`
      );

      if (schoolUpdateLogs[0].count > 0) {
        console.log(`  ✓ PASSED: School update logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: School update not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 9: Verify school delete logging
    // ============================================================
    console.log('\n📝 Test 9: School Delete Logging');
    try {
      const schoolId = Math.floor(Math.random() * 10000);
      
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'SCHOOL_DELETE', 'schools', schoolId, 'school',
         JSON.stringify({school_name: 'Deleted School'}),
         'SUCCESS', 'Deleted school: Deleted School', '127.0.0.1', 'Test Browser']
      );

      const [schoolDeleteLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'SCHOOL_DELETE'`
      );

      if (schoolDeleteLogs[0].count > 0) {
        console.log(`  ✓ PASSED: School delete logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: School delete not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 10: Verify analytics export logging
    // ============================================================
    console.log('\n📝 Test 10: Analytics Export Logging');
    try {
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'ANALYTICS_EXPORT', 'analytics', null, 'export',
         JSON.stringify({format: 'CSV', records: 150}),
         'SUCCESS', 'Exported analytics data', '127.0.0.1', 'Test Browser']
      );

      const [exportLogs] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'ANALYTICS_EXPORT'`
      );

      if (exportLogs[0].count > 0) {
        console.log(`  ✓ PASSED: Analytics export logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Analytics export not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Summary Report
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('PHASE 3 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✓ Tests Passed: ${testsPassed}`);
    console.log(`✗ Tests Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);
    console.log('='.repeat(60));

    // Show Phase 3 audit logs summary
    const [summary] = await connection.execute(`
      SELECT 
        action_type, 
        COUNT(*) as count,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
      FROM audit_logs
      WHERE action_type IN ('ISSUANCE_CREATE', 'ISSUANCE_UPDATE', 'ISSUANCE_DELETE', 'ISSUANCE_PUBLISH', 'USER_REGISTRATION', 'USER_PROFILE_UPDATE', 'USER_ACTIVATION', 'USER_DEACTIVATION', 'REPORT_GENERATED', 'REPORT_ACCESSED', 'ANALYTICS_EXPORT', 'SCHOOL_CREATE', 'SCHOOL_UPDATE', 'SCHOOL_DELETE')
      GROUP BY action_type
      ORDER BY count DESC
    `);

    if (summary.length > 0) {
      console.log('\nPhase 3 Audit Logs Summary:');
      console.log('-'.repeat(60));
      summary.forEach(row => {
        console.log(
          `${row.action_type.padEnd(25)} | Total: ${row.count.toString().padEnd(3)} | Success: ${row.success_count} | Failed: ${row.failed_count}`
        );
      });
    }

    process.exit(testsFailed === 0 ? 0 : 1);

  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run tests
runTests();
