const FORBIDDEN = new Set(
  'qwerty,123456,password,admin,12345678,111111,123456789,abc123,password1'
    .split(',')
    .map((s) => s.toLowerCase())
);

/** @returns {{ ok: boolean, errors: string[] }} */
function validatePasswordStrength(plain) {
  const errors = [];
  if (typeof plain !== 'string') {
    return { ok: false, errors: ['Password is required'] };
  }
  const len = plain.length;
  if (len < 8 || len > 12) {
    errors.push('Use 8–12 characters');
  }
  if (!/[A-Z]/.test(plain)) errors.push('Include an uppercase letter');
  if (!/[a-z]/.test(plain)) errors.push('Include a lowercase letter');
  if (!/[0-9]/.test(plain)) errors.push('Include a number');
  if (!/[^A-Za-z0-9]/.test(plain)) errors.push('Include a special character');

  const lower = plain.toLowerCase();
  if (FORBIDDEN.has(lower)) {
    errors.push('This password is not allowed');
  }
  for (const word of FORBIDDEN) {
    if (word.length >= 4 && lower.includes(word)) {
      errors.push('This password is not allowed');
      break;
    }
  }

  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

/**
 * One-time “first admin” signup — simpler than full policy: 8–72 chars, upper, lower, digit.
 * No special-character requirement (bcrypt still applies on the server).
 * @returns {{ ok: boolean, errors: string[] }}
 */
function validateBootstrapPassword(plain) {
  const errors = [];
  if (typeof plain !== 'string') {
    return { ok: false, errors: ['Password is required'] };
  }
  const len = plain.length;
  if (len < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(plain)) errors.push('Include at least one uppercase letter');
  if (!/[a-z]/.test(plain)) errors.push('Include at least one lowercase letter');
  if (!/[0-9]/.test(plain)) errors.push('Include at least one number');

  const lower = plain.toLowerCase();
  if (FORBIDDEN.has(lower)) {
    errors.push('This password is too simple or common');
  }
  for (const word of FORBIDDEN) {
    if (word.length >= 4 && lower.includes(word)) {
      errors.push('Password contains a forbidden common word');
      break;
    }
  }

  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

/**
 * Lightweight strength score for UI (0 weak, 1 medium, 2 strong)
 * Mirrors validatePasswordStrength (8–12 characters and character-class rules).
 */
function passwordStrengthScore(plain) {
  if (!plain || plain.length < 8) return 0;
  let score = 0;
  if (/[A-Z]/.test(plain)) score++;
  if (/[a-z]/.test(plain)) score++;
  if (/[0-9]/.test(plain)) score++;
  if (/[^A-Za-z0-9]/.test(plain)) score++;
  if (plain.length >= 10) score++;
  const { ok } = validatePasswordStrength(plain);
  if (!ok && score >= 3) return 1;
  if (ok && score >= 5) return 2;
  if (ok && score >= 4) return 2;
  if (score >= 3) return 1;
  return 0;
}

module.exports = {
  validatePasswordStrength,
  validateBootstrapPassword,
  passwordStrengthScore,
  FORBIDDEN,
};
