/**
 * Central JWT secret resolution — avoids shipping a weak default in production.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a strong random string (at least 32 characters) in production.'
      );
    }
    return secret;
  }

  if (secret && secret !== 'change-me') {
    return secret;
  }

  return 'dev-only-insecure-jwt-secret-do-not-use-in-production';
}

const ADMIN_ROLES = new Set(['SuperAdmin', 'Editor', 'Viewer', 'admin']);

module.exports = { getJwtSecret, ADMIN_ROLES };
