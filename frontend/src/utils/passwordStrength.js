/** Mirror backend rules for instant UI feedback (not authoritative). */
const FORBIDDEN = new Set(
  ['qwerty', '123456', 'password', 'admin', '12345678', '111111', '123456789', 'abc123', 'password1']
);

export function passwordChecks(plain) {
  const s = typeof plain === 'string' ? plain : '';
  return {
    length: s.length >= 8 && s.length <= 12,
    upper: /[A-Z]/.test(s),
    lower: /[a-z]/.test(s),
    number: /[0-9]/.test(s),
    symbol: /[^A-Za-z0-9]/.test(s),
    notBanned: !FORBIDDEN.has(s.toLowerCase()),
  };
}

/** @returns {0|1|2} weak | medium | strong */
export function strengthLevel(plain) {
  const c = passwordChecks(plain);
  const met = [c.length, c.upper, c.lower, c.number, c.symbol, c.notBanned].filter(Boolean).length;
  if (!plain || plain.length < 8 || plain.length > 12) return 0;
  if (met >= 6) return 2;
  if (met >= 4) return 1;
  return 0;
}
