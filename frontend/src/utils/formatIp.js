/**
 * Display-friendly IP for Activity Log (avoids raw IPv6-mapped forms for readers).
 */
export function formatIpDisplay(ip) {
  if (ip == null || String(ip).trim() === '') return '—';
  const s = String(ip).trim();
  if (s === '::1') return 'localhost';
  if (s.startsWith('::ffff:')) return s.slice(7);
  return s;
}
