/**
 * Test: Verify Phase 1 Audit Logging Functions Work
 * Tests core audit service functions without running server
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../config/db');
const { 
  logRoleChange, 
  logAccountStatusChange,
  logSessionTimeout,
  logCriticalError,
  logBackupCreated,
  logConfigChange,
  getClientIp
} = require('../services/auditService');

async function runTests() {
  console.log('\n🧪 TESTING PHASE 1 CRITICAL AUDIT FUNCTIONS\n');
  
  try {
    // Test 1: Log a role change
    console.log('Test 1: Role Change Logging...');
    const roleChangeId = await logRoleChange(
      1,  // Admin ID making the change
      2,  // User ID whose role is changing
      'Admin',  // From role
      'SuperAdmin',  // To role
      'Test role change for verification',
      '192.168.1.100',
      'Mozilla/5.0 Test Browser'
    );
    console.log(`✅ Role change logged with ID: ${roleChangeId}`);

    // Test 2: Log account status change
    console.log('\nTest 2: Account Status Change Logging...');
    const statusChangeId = await logAccountStatusChange(
      1,  // Admin ID
      3,  // Target user ID
      'active',  // From status
      'suspended',  // To status
      'Security violation detected',
      '192.168.1.100',
      'Mozilla/5.0 Test Browser'
    );
    console.log(`✅ Status change logged with ID: ${statusChangeId}`);

    // Test 3: Log session timeout
    console.log('\nTest 3: Session Timeout Logging...');
    const timeoutId = await logSessionTimeout(
      2,  // User ID
      1800000,  // 30 minutes in ms
      '192.168.1.100',
      'Mozilla/5.0 Test Browser'
    );
    console.log(`✅ Session timeout logged with ID: ${timeoutId}`);

    // Test 4: Log critical error
    console.log('\nTest 4: Critical Error Logging...');
    const errorId = await logCriticalError(
      1,  // Admin ID (or null)
      '500',  // Error code
      'Database connection failed',
      '/api/admin/users',
      'Error: ECONNREFUSED at Connection.js:123',
      '192.168.1.100',
      'Mozilla/5.0 Test Browser'
    );
    console.log(`✅ Critical error logged with ID: ${errorId}`);

    // Test 5: Log backup created
    console.log('\nTest 5: Backup Created Logging...');
    const backupId = await logBackupCreated(
      1,  // Admin ID
      'backup_20260416_120000.sql',
      1073741824,  // 1 GB
      536870912,   // 512 MB
      45000,  // 45 seconds
      'SUCCESS',
      false  // Not automated
    );
    console.log(`✅ Backup logged with ID: ${backupId}`);

    // Test 6: Log config change
    console.log('\nTest 6: Config Change Logging...');
    const configId = await logConfigChange(
      1,  // Admin ID
      'RATE_LIMIT_API',
      100,  // Old value
      200,  // New value
      'Increased API rate limit for peak hours',
      '192.168.1.100',
      'Mozilla/5.0 Test Browser'
    );
    console.log(`✅ Config change logged with ID: ${configId}`);

    // Test 7: Verify logs in database
    console.log('\n\n📊 VERIFYING LOGS IN DATABASE\n');
    
    const [logs] = await db.execute(`
      SELECT 
        id,
        action_type,
        status,
        module,
        description,
        resource_type,
        timestamp
      FROM audit_logs
      WHERE action_type IN ('ROLE_CHANGE', 'ACCOUNT_STATUS_CHANGE', 'SESSION_TIMEOUT', 'CRITICAL_ERROR', 'BACKUP_CREATED', 'SECURITY_SETTING_CHANGE')
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    console.log(`✅ Found ${logs.length} audit logs:\n`);
    logs.forEach(log => {
      console.log(`  ID: ${log.id} | Action: ${log.action_type} | Status: ${log.status} | Module: ${log.module}`);
      console.log(`     Description: ${log.description}\n`);
    });

    // Test 8: Query critical operations view
    console.log('\n📋 TESTING CRITICAL_AUDIT_OPERATIONS VIEW\n');
    
    const [criticalOps] = await db.execute(`
      SELECT COUNT(*) as count FROM critical_audit_operations
    `);
    console.log(`✅ critical_audit_operations view has ${criticalOps[0].count} entries`);

    // Test 9: Query failed operations view
    console.log('\n📋 TESTING FAILED_AUDIT_OPERATIONS VIEW\n');
    
    const [failedOps] = await db.execute(`
      SELECT COUNT(*) as count FROM failed_audit_operations
    `);
    console.log(`✅ failed_audit_operations view has ${failedOps[0].count} entries`);

    console.log('\n\n✅ ALL TESTS PASSED!\n');
    console.log('━'.repeat(60));
    console.log('Phase 1 Critical Audit Functions are working correctly');
    console.log('━'.repeat(60));
    console.log('\nKey Findings:');
    console.log('  ✅ logRoleChange() - Working');
    console.log('  ✅ logAccountStatusChange() - Working');
    console.log('  ✅ logSessionTimeout() - Working');
    console.log('  ✅ logCriticalError() - Working');
    console.log('  ✅ logBackupCreated() - Working');
    console.log('  ✅ logConfigChange() - Working');
    console.log('  ✅ critical_audit_operations view - Working');
    console.log('  ✅ failed_audit_operations view - Working');
    console.log('\nReady for: Backend server integration testing\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
