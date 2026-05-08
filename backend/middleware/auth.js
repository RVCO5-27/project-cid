const jwt = require('jsonwebtoken');
const { getJwtSecret, ADMIN_ROLES } = require('../config/security');
const { logPermissionDenied, getClientIp, getUserAgent } = require('../services/auditService');

function bearerFromHeader(req) {
  const h = req.headers.authorization;
  if (!h || typeof h !== 'string') return null;
  const m = h.match(/^Bearer\s+(\S+)/i);
  return m ? m[1] : null;
}

/** Log only for staff-only API areas (skip noisy public or profile checks). */
function shouldLogBlockedApiAccess(req) {
  const path = String(req.originalUrl || req.url || '').split('?')[0];
  if (path.startsWith('/api/ping')) return false;
  if (path.startsWith('/api/auth/profile')) return false;
  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/recovery')) return false;
  if (path.startsWith('/api/auth/logout')) return false;

  const prefixes = ['/api/admin', '/api/audit-logs', '/api/schools', '/api/upload'];
  if (prefixes.some((p) => path.startsWith(p))) return true;
  if (path.startsWith('/api/carousel') && req.method !== 'GET' && req.method !== 'HEAD') return true;
  if (path.startsWith('/api/organizational-chart') && req.method !== 'GET' && req.method !== 'HEAD') {
    return true;
  }
  return false;
}

function auditBlockedAccess(req, description) {
  if (!shouldLogBlockedApiAccess(req)) return;
  const path = String(req.originalUrl || req.url || '').split('?')[0];
  void logPermissionDenied({
    userId: req.user?.id ?? null,
    description,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    path,
    method: req.method,
  });
}

exports.authMiddleware = (req, res, next) => {
  // Prefer explicit Bearer (SPA localStorage fallback); then HttpOnly cookie
  const token = bearerFromHeader(req) || req.cookies?.authToken;
  if (!token) {
    auditBlockedAccess(req, 'Sign-in required (no security token was sent)');
    return res.status(401).json({ message: 'Missing auth token' });
  }
  let secret;
  try {
    secret = getJwtSecret();
  } catch (configErr) {
    console.error(configErr);
    return res.status(500).json({ message: 'Server configuration error' });
  }
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    auditBlockedAccess(req, 'Sign-in required (session expired or token not valid)');
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Requires a valid admin JWT including role (re-login if token predates role claim).
 */
exports.requireAdminRole = (req, res, next) => {
  const role = req.user && req.user.role;
  if (!role || !ADMIN_ROLES.has(role)) {
    auditBlockedAccess(req, 'Blocked: school portal staff sign-in is required for this action');
    return res.status(403).json({ message: 'Admin access required. Please sign in again.' });
  }
  next();
};
