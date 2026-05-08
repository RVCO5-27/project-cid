/**
 * Removes all admin accounts so POST /api/create-admin can run again.
 * Order respects FKs: login_recovery / login_attempts, then admins; users with role admin.
 *
 * Usage (from backend/): node scripts/clearAdminsForBootstrap.js
 */
require('dotenv').config();
const db = require('../config/db');

const steps = [
  { sql: 'DELETE FROM login_recovery', label: 'login_recovery' },
  { sql: 'DELETE FROM login_attempts', label: 'login_attempts' },
  { sql: 'DELETE FROM admins', label: 'admins' },
];

async function run() {
  for (const { sql, label, params } of steps) {
    try {
      const [result] = params ? await db.execute(sql, params) : await db.execute(sql);
      const n = result.affectedRows;
      console.log(`OK ${label}: ${n} row(s)`);
    } catch (e) {
      if (e.code === 'ER_NO_SUCH_TABLE') {
        console.warn(`Skip ${label}: table missing`);
      } else {
        throw e;
      }
    }
  }

  console.log('Bootstrap reset complete. You can use POST /api/create-admin once.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
