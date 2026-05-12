const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

function resolveSsl() {
  const v = (process.env.DB_SSL || '').toLowerCase();
  if (v === 'false' || v === '0' || v === 'off') return undefined;
  if (v === 'true' || v === '1' || v === 'required') {
    const strict = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
    return { rejectUnauthorized: strict };
  }
  return undefined;
}

const poolOptions = {
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
};

let pool;

if (databaseUrl && /^mysql:\/\//i.test(String(databaseUrl).trim())) {
  pool = mysql.createPool({
    ...poolOptions,
    uri: String(databaseUrl).trim(),
  });
} else {
  const host = process.env.DB_HOST || 'localhost';
  const password =
    process.env.DB_PASS !== undefined && process.env.DB_PASS !== null
      ? process.env.DB_PASS
      : process.env.DB_PASSWORD || '';

  pool = mysql.createPool({
    ...poolOptions,
    host,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password,
    database: process.env.DB_NAME || 'cid_shs_db',
    ssl: resolveSsl(),
  });
}

const isProd = process.env.NODE_ENV === 'production';
const usingUrl = Boolean(databaseUrl && /^mysql:\/\//i.test(String(databaseUrl).trim()));
if (isProd && !usingUrl) {
  const h = process.env.DB_HOST || '';
  if (!h || h === 'localhost' || h === '127.0.0.1') {
    console.error(
      '[db] Production: DB_HOST is localhost or empty. Render cannot reach your PC or XAMPP. ' +
        'Use hosted MySQL: set DATABASE_URL or DB_HOST, DB_USER, DB_PASS, DB_NAME, then redeploy.'
    );
  }
}

pool
  .getConnection()
  .then((conn) => {
    conn.release();
    console.log(
      `[db] Connected (${usingUrl ? 'DATABASE_URL' : process.env.DB_HOST || 'localhost'} / ${process.env.DB_NAME || 'cid_shs_db'})`
    );
  })
  .catch((err) => {
    console.error('[db] MySQL pool connection error (continuing):', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error(
        '[db] Hint: connection refused. Use a cloud MySQL hostname on Render, not localhost.'
      );
    }
  });

pool.close = async function closePool() {
  try {
    await pool.end();
    console.log('MySQL pool closed');
  } catch (err) {
    console.error('Error closing MySQL pool:', err && err.message);
  }
};

module.exports = pool;