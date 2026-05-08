/**
 * Security audit trail → audit_logs (optional if table missing).
 * Independent of any “main admin”; all server-driven events.
 */
const db = require('../config/db');

let auditAvailable = true;

async function probe() {
  try {
    await db.execute('SELECT 1 FROM audit_logs LIMIT 1');
    auditAvailable = true;
  } catch {
    auditAvailable = false;
  }
}
probe();

function trimAction(text) {
  const s = String(text || '');
  return s.length > 255 ? s.slice(0, 252) + '...' : s;
}

/**
 * @param {string} action
 * @param {{ adminId?: number|null, ip?: string|null }} ctx
 */
async function logAuthEvent(action, ctx = {}) {
  if (!auditAvailable) return;
  const adminId = ctx.adminId == null ? null : Number(ctx.adminId);
  const ip = ctx.ip ? String(ctx.ip).slice(0, 45) : null;
  try {
    await db.execute(
      'INSERT INTO audit_logs (admin_id, action, ip_address) VALUES (?, ?, ?)',
      [adminId || null, trimAction(action), ip]
    );
  } catch (e) {
    console.warn('[authAudit]', e.message);
  }
}

function clientIp(req) {
  if (!req) return null;
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim().slice(0, 45);
  return (req.socket && req.socket.remoteAddress) ? String(req.socket.remoteAddress).slice(0, 45) : null;
}

module.exports = { logAuthEvent, clientIp };
