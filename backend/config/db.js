const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

/**
 * Optional TLS for mysql2 (TiDB Cloud, PlanetScale, RDS, etc.).
 * Set DB_SSL=false to force off. TiDB Cloud URLs get TLS by default unless disabled.
 */
function resolveSsl(hint) {
  const hintStr = String(hint || '');
  const flag = (process.env.DB_SSL || '').toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'off') {
    return undefined;
  }

  let ca;
  const caPath = process.env.DB_SSL_CA;
  if (caPath) {
    const full = path.isAbsolute(caPath) ? caPath : path.join(__dirname, '..', caPath);
    try {
      ca = fs.readFileSync(full);
    } catch (e) {
      console.warn('[db] DB_SSL_CA could not be read:', full, '-', e.message);
    }
  }

  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
  const sslOpts = { rejectUnauthorized };
  if (ca) {
    sslOpts.ca = ca;
  }

  if (flag === 'true' || flag === '1' || flag === 'required' || ca) {
    return sslOpts;
  }

  if (/tidbcloud\.com|\.psdb\.cloud/i.test(hintStr)) {
    return sslOpts;
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
const trimmedUrl = databaseUrl && String(databaseUrl).trim();
const usingUrl = Boolean(trimmedUrl && /^mysql:\/\//i.test(trimmedUrl));

if (usingUrl) {
  const ssl = resolveSsl(trimmedUrl);
  pool = mysql.createPool({
    ...poolOptions,
    uri: trimmedUrl,
    ...(ssl ? { ssl } : {}),
  });
} else {
  const host = process.env.DB_HOST || 'localhost';
  const password =
    process.env.DB_PASS !== undefined && process.env.DB_PASS !== null
      ? process.env.DB_PASS
      : process.env.DB_PASSWORD || '';

  const ssl = resolveSsl(host);
  pool = mysql.createPool({
    ...poolOptions,
    host,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password,
    database: process.env.DB_NAME || 'shs',
    ...(ssl ? { ssl } : {}),
  });
}

const isProd = process.env.NODE_ENV === 'production';
if (isProd && !usingUrl) {
  const h = process.env.DB_HOST || '';
  if (!h || h === 'localhost' || h === '127.0.0.1') {
    console.error(
      '[db] Production: DB_HOST is localhost or empty. Hosted Node cannot reach your PC or XAMPP. ' +
        'Set DATABASE_URL (e.g. TiDB Cloud mysql://...) or DB_HOST / DB_USER / DB_PASS / DB_NAME, then redeploy.'
    );
  }
}

pool
  .getConnection()
  .then((conn) => {
    conn.release();
    const label = usingUrl ? 'DATABASE_URL' : process.env.DB_HOST || 'localhost';
    const dbName = usingUrl ? '(from URL)' : process.env.DB_NAME || 'shs';
    console.log(`[db] Connected (${label} / ${dbName})`);
  })
  .catch((err) => {
    console.error('[db] MySQL pool connection error (continuing):', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error(
        '[db] Hint: connection refused — check host/port and that the server allows remote connections.'
      );
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('[db] Hint: access denied — check user, password, and URL-encoding special chars in DATABASE_URL.');
    }
    if (err.code === 'SELF_SIGNED_CERT_IN_CHAIN' || err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
      console.error(
        '[db] Hint: TLS certificate issue — set DB_SSL_CA to your provider CA PEM (e.g. cert/isrgrootx1.pem) or DB_SSL_REJECT_UNAUTHORIZED=false only if the provider documents it.'
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