const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shs',
    multipleStatements: true
  });

  console.log('--- Running Admin Issuances Migration ---');
  const migrationPath = path.join(__dirname, '../../database/admin_issuances_migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    await connection.query(sql);
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
