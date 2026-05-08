export function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function mustChangePasswordFromStorage() {
  const t = localStorage.getItem('token');
  const p = parseJwtPayload(t);
  return p && p.mustChangePassword === true;
}
