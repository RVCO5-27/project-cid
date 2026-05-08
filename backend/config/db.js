const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cid_shs_db',
    // Required to run our .sql migration files as-is (they contain multiple statements).
    // This is safe as long as we NEVER concatenate user input into SQL strings.
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(conn => {
        conn.release();
        console.log(`Successfully connected to ${process.env.DB_NAME || 'cid_shs_db'} (pool)`);
    })
    .catch(err => {
        console.error('MySQL pool connection error (continuing):', err.message);
    });

// attach a close helper to allow tests or other callers to gracefully end the pool
pool.close = async function() {
    try {
        await pool.end();
        console.log('MySQL pool closed');
    } catch (err) {
        console.error('Error closing MySQL pool:', err && err.message);
    }
};

module.exports = pool;
