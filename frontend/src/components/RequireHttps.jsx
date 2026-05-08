import { useLayoutEffect, useState } from 'react';

function isLocalHost(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost')
  );
}

/**
 * Forces HTTPS for admin routes in production when VITE_ADMIN_REQUIRE_HTTPS=true.
 * Localhost stays on http for Vite dev unless you use a tunnel / real hostname.
 */
export default function RequireHttps({ children }) {
  const [ready, setReady] = useState(() => {
    if (typeof window === 'undefined') return true;
    const enforce =
      import.meta.env.VITE_ADMIN_REQUIRE_HTTPS === 'true' ||
      (import.meta.env.PROD && import.meta.env.VITE_ADMIN_REQUIRE_HTTPS !== 'false');
    if (!enforce) return true;
    if (isLocalHost(window.location.hostname)) return true;
    return window.location.protocol === 'https:';
  });

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const enforce =
      import.meta.env.VITE_ADMIN_REQUIRE_HTTPS === 'true' ||
      (import.meta.env.PROD && import.meta.env.VITE_ADMIN_REQUIRE_HTTPS !== 'false');
    if (!enforce) return undefined;
    if (isLocalHost(window.location.hostname)) return undefined;
    if (window.location.protocol === 'https:') return undefined;
    const { host, pathname, search, hash } = window.location;
    window.location.replace(`https://${host}${pathname}${search}${hash}`);
    return undefined;
  }, []);

  if (!ready) {
    return (
      <div className="admin-https-redirect" role="status">
        <p>Switching to a secure (HTTPS) connection…</p>
      </div>
    );
  }

  return children;
}
