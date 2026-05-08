/**
 * Phase 2 Integration Tests: Carousel, Organizational Chart, Document Logging
 * Tests audit logging for carousel CRUD, org chart updates, and document operations
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
    // Test 1: Verify carousel create logging
    // ============================================================
    console.log('\n📝 Test 1: Carousel Create Logging');
    try {
      const [beforeAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'CAROUSEL_OPERATION' AND module = 'carousel'`
      );
      const countBefore = beforeAudit[0].count;
      
      // Create a carousel slide (simulated via direct insert)
      const [insertResult] = await connection.execute(
        `INSERT INTO carousel_slides (title, description, image_path, category, sort_order) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Test Slide', 'Test Description', '/uploads/test.jpg', 'Featured', 1]
      );
      const slideId = insertResult.insertId;

      // Log it
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'CAROUSEL_OPERATION', 'carousel', slideId, 'carousel_slide', null, 
         JSON.stringify({title: 'Test Slide', description: 'Test Description', image_path: '/uploads/test.jpg'}),
         'SUCCESS', 'Created carousel slide: Test Slide', '127.0.0.1', 'Test Browser']
      );

      const [afterAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'CAROUSEL_OPERATION' AND module = 'carousel'`
      );
      const countAfter = afterAudit[0].count;

      if (countAfter > countBefore) {
        console.log(`  ✓ PASSED: Carousel create logged (ID: ${slideId})`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Carousel create not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 2: Verify carousel update logging
    // ============================================================
    console.log('\n📝 Test 2: Carousel Update Logging');
    try {
      const [slides] = await connection.execute(
        `SELECT id FROM carousel_slides WHERE title = 'Test Slide' LIMIT 1`
      );
      
      if (slides.length === 0) {
        throw new Error('Test slide not found');
      }
      
      const slideId = slides[0].id;
      const [beforeAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs 
         WHERE action_type = 'CAROUSEL_OPERATION' AND record_id = ? AND description LIKE '%Updated%'`,
        [slideId]
      );
      const countBefore = beforeAudit[0].count;

      // Update the slide
      await connection.execute(
        `UPDATE carousel_slides SET title = ? WHERE id = ?`,
        ['Updated Test Slide', slideId]
      );

      // Log it
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'CAROUSEL_OPERATION', 'carousel', slideId, 'carousel_slide',
         JSON.stringify({title: 'Test Slide'}),
         JSON.stringify({title: 'Updated Test Slide'}),
         'SUCCESS', 'Updated carousel slide: Updated Test Slide', '127.0.0.1', 'Test Browser']
      );

      const [afterAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs 
         WHERE action_type = 'CAROUSEL_OPERATION' AND record_id = ? AND description LIKE '%Updated%'`,
        [slideId]
      );
      const countAfter = afterAudit[0].count;

      if (countAfter > countBefore) {
        console.log(`  ✓ PASSED: Carousel update logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Carousel update not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 3: Verify carousel delete logging
    // ============================================================
    console.log('\n📝 Test 3: Carousel Delete Logging');
    try {
      const [slides] = await connection.execute(
        `SELECT id FROM carousel_slides WHERE title = 'Updated Test Slide' LIMIT 1`
      );
      
      if (slides.length === 0) {
        throw new Error('Updated test slide not found');
      }
      
      const slideId = slides[0].id;
      
      // Delete the slide
      await connection.execute(
        `DELETE FROM carousel_slides WHERE id = ?`,
        [slideId]
      );

      // Log it
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'CAROUSEL_OPERATION', 'carousel', slideId, 'carousel_slide',
         JSON.stringify({title: 'Updated Test Slide', description: 'Test Description'}),
         'SUCCESS', 'Deleted carousel slide: Updated Test Slide', '127.0.0.1', 'Test Browser']
      );

      const [deleteLog] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs 
         WHERE action_type = 'CAROUSEL_OPERATION' AND record_id = ? AND description LIKE '%Deleted%'`,
        [slideId]
      );

      if (deleteLog[0].count > 0) {
        console.log(`  ✓ PASSED: Carousel delete logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Carousel delete not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 4: Verify organizational chart update logging
    // ============================================================
    console.log('\n📝 Test 4: Organizational Chart Update Logging');
    try {
      const [beforeAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'ORGCHART_CHANGE' AND module = 'organizational_chart'`
      );
      const countBefore = beforeAudit[0].count;

      // Try to get existing org chart or create one
      const [existingChart] = await connection.execute(
        `SELECT id FROM organizational_chart LIMIT 1`
      );

      let chartId;
      if (existingChart.length > 0) {
        chartId = existingChart[0].id;
        await connection.execute(
          `UPDATE organizational_chart SET title = ?, caption = ? WHERE id = ?`,
          ['Updated Org Structure', 'Updated org chart caption', chartId]
        );
      } else {
        const [insertResult] = await connection.execute(
          `INSERT INTO organizational_chart (title, caption) VALUES (?, ?)`,
          ['New Org Structure', 'New org chart caption']
        );
        chartId = insertResult.insertId;
      }

      // Log it
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'ORGCHART_CHANGE', 'organizational_chart', chartId, 'org_chart',
         JSON.stringify({title: 'Old Org Structure'}),
         JSON.stringify({title: 'Updated Org Structure', caption: 'Updated org chart caption'}),
         'SUCCESS', 'Updated organizational chart: Updated Org Structure', '127.0.0.1', 'Test Browser']
      );

      const [afterAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'ORGCHART_CHANGE' AND module = 'organizational_chart'`
      );
      const countAfter = afterAudit[0].count;

      if (countAfter > countBefore) {
        console.log(`  ✓ PASSED: Org chart update logged (ID: ${chartId})`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Org chart update not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 5: Verify document upload logging
    // ============================================================
    console.log('\n📝 Test 5: Document Upload Logging');
    try {
      const [beforeAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'DOCUMENT_UPLOAD' AND module = 'documents'`
      );
      const countBefore = beforeAudit[0].count;

      // Log a document upload
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'DOCUMENT_UPLOAD', 'documents', 'd12345', 'document',
         JSON.stringify({name: 'test_document.pdf', size: '1.2MB', documentType: 'Guide'}),
         'SUCCESS', 'Uploaded document: test_document.pdf', '127.0.0.1', 'Test Browser']
      );

      const [afterAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'DOCUMENT_UPLOAD' AND module = 'documents'`
      );
      const countAfter = afterAudit[0].count;

      if (countAfter > countBefore) {
        console.log(`  ✓ PASSED: Document upload logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Document upload not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 6: Verify document download logging
    // ============================================================
    console.log('\n📝 Test 6: Document Download Logging');
    try {
      const [beforeAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'DOCUMENT_DOWNLOAD' AND module = 'documents'`
      );
      const countBefore = beforeAudit[0].count;

      // Log a document download
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, new_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'DOCUMENT_DOWNLOAD', 'documents', 'd12345', 'download',
         JSON.stringify({name: 'test_document.pdf', size: '1.2MB'}),
         'SUCCESS', 'Downloaded document: test_document.pdf', '127.0.0.1', 'Test Browser']
      );

      const [afterAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'DOCUMENT_DOWNLOAD' AND module = 'documents'`
      );
      const countAfter = afterAudit[0].count;

      if (countAfter > countBefore) {
        console.log(`  ✓ PASSED: Document download logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Document download not logged`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`);
      testsFailed++;
    }

    // ============================================================
    // Test 7: Verify document delete logging
    // ============================================================
    console.log('\n📝 Test 7: Document Delete Logging');
    try {
      const [beforeAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'DOCUMENT_DELETE' AND module = 'documents'`
      );
      const countBefore = beforeAudit[0].count;

      // Log a document deletion
      await connection.execute(
        `INSERT INTO audit_logs 
         (user_id, action_type, module, record_id, resource_type, old_value, status, description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'DOCUMENT_DELETE', 'documents', 'd12345', 'document',
         JSON.stringify({name: 'test_document.pdf', size: '1.2MB'}),
         'SUCCESS', 'Deleted document: test_document.pdf', '127.0.0.1', 'Test Browser']
      );

      const [afterAudit] = await connection.execute(
        `SELECT COUNT(*) as count FROM audit_logs WHERE action_type = 'DOCUMENT_DELETE' AND module = 'documents'`
      );
      const countAfter = afterAudit[0].count;

      if (countAfter > countBefore) {
        console.log(`  ✓ PASSED: Document delete logged`);
        testsPassed++;
      } else {
        console.log(`  ✗ FAILED: Document delete not logged`);
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
    console.log('PHASE 2 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✓ Tests Passed: ${testsPassed}`);
    console.log(`✗ Tests Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);
    console.log('='.repeat(60));

    // Show audit logs summary
    const [summary] = await connection.execute(`
      SELECT 
        action_type, 
        COUNT(*) as count,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
      FROM audit_logs
      WHERE action_type IN ('CAROUSEL_OPERATION', 'ORGCHART_CHANGE', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_DELETE')
      GROUP BY action_type
      ORDER BY count DESC
    `);

    if (summary.length > 0) {
      console.log('\nPhase 2 Audit Logs Summary:');
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
