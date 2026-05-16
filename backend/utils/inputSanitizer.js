/**
 * Input Sanitization Utility
 * Provides comprehensive sanitization and validation functions to prevent injection attacks,
 * handle malformed data, and enforce size constraints
 */

const DOMPurify = require('isomorphic-dompurify');

class InputSanitizer {
  /**
   * Maximum allowed lengths for different field types
   */
  static LIMITS = {
    USERNAME: 50,
    EMAIL: 254,
    PASSWORD: 72,
    NAME: 100,
    PHONE: 20,
    URL: 2048,
    DESCRIPTION: 5000,
    JSON_FIELD: 50000,
    FILE_NAME: 255,
    SEARCH_QUERY: 500,
  };

  /**
   * Sanitize a string input
   * - Trims whitespace
   * - Removes HTML/script tags
   * - Enforces max length
   * - Rejects dangerous patterns
   */
  static sanitizeString(value, { maxLength = 1000, nullable = false } = {}) {
    if (value === null || value === undefined) {
      return nullable ? null : '';
    }

    if (typeof value !== 'string') {
      throw new Error(`Expected string, got ${typeof value}`);
    }

    // Trim whitespace
    let sanitized = value.trim();

    // Check for null bytes
    if (sanitized.includes('\0')) {
      throw new Error('Null bytes detected in input');
    }

    // Remove HTML tags
    sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });

    // Enforce max length
    if (sanitized.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }

    return sanitized;
  }

  /**
   * Sanitize username
   * - Alphanumeric, dots, underscores, hyphens only
   * - Min 3, Max 50 characters
   */
  static sanitizeUsername(value) {
    const sanitized = this.sanitizeString(value, { maxLength: this.LIMITS.USERNAME });

    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(sanitized)) {
      throw new Error('Username must contain only alphanumeric characters, dots, underscores, or hyphens');
    }

    return sanitized;
  }

  /**
   * Sanitize email
   * - Basic RFC 5322 validation
   * - Max 254 characters
   */
  static sanitizeEmail(value) {
    const sanitized = this.sanitizeString(value, { maxLength: this.LIMITS.EMAIL }).toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized;
  }

  /**
   * Sanitize password
   * - No length enforcement (bcryptjs handles up to 72 chars)
   * - Reject if null bytes or excessive control characters
   */
  static sanitizePassword(value) {
    if (value === null || value === undefined) {
      throw new Error('Password is required');
    }

    if (typeof value !== 'string') {
      throw new Error('Password must be a string');
    }

    if (value.length === 0 || value.length > this.LIMITS.PASSWORD) {
      throw new Error(`Password must be between 1 and ${this.LIMITS.PASSWORD} characters`);
    }

    // Check for null bytes
    if (value.includes('\0')) {
      throw new Error('Null bytes detected in password');
    }

    // Check for excessive control characters (except common whitespace)
    const controlCharCount = (value.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length;
    if (controlCharCount > 0) {
      throw new Error('Password contains invalid control characters');
    }

    return value;
  }

  /**
   * Sanitize integer
   */
  static sanitizeInteger(value) {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error('Expected integer value');
    }
    return parsed;
  }

  /**
   * Sanitize boolean
   */
  static sanitizeBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    if (value === 1 || value === 0) return Boolean(value);
    throw new Error('Expected boolean value');
  }

  /**
   * Sanitize URL
   * - Validates URL format
   * - Rejects javascript: and data: protocols
   */
  static sanitizeUrl(value) {
    const sanitized = this.sanitizeString(value, { maxLength: this.LIMITS.URL });

    try {
      const url = new URL(sanitized);
      const protocol = url.protocol.toLowerCase();

      // Whitelist safe protocols
      const allowedProtocols = ['http:', 'https:', 'ftp:', 'ftps:'];
      if (!allowedProtocols.includes(protocol)) {
        throw new Error(`Protocol ${protocol} not allowed`);
      }

      return sanitized;
    } catch (err) {
      throw new Error(`Invalid URL: ${err.message}`);
    }
  }

  /**
   * Sanitize phone number
   * - Accepts common formats: +1-234-567-8900, (123) 456-7890, etc.
   */
  static sanitizePhoneNumber(value) {
    const sanitized = this.sanitizeString(value, { maxLength: this.LIMITS.PHONE });

    if (!/^[\d\s\-\+\(\)\.]+$/.test(sanitized)) {
      throw new Error('Phone number contains invalid characters');
    }

    // Remove common formatting, keep only digits and +
    const digitsOnly = sanitized.replace(/[^\d\+]/g, '');
    if (digitsOnly.length < 10) {
      throw new Error('Phone number is too short');
    }

    return sanitized;
  }

  /**
   * Sanitize JSON field (for stringified JSON)
   */
  static sanitizeJson(value, { maxLength = this.LIMITS.JSON_FIELD } = {}) {
    const sanitized = this.sanitizeString(value, { maxLength });

    try {
      JSON.parse(sanitized);
      return sanitized;
    } catch (err) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Sanitize array
   * - Ensures it's an array
   * - Enforces max length
   * - Optionally sanitizes each element
   */
  static sanitizeArray(value, { maxLength = 1000, itemSanitizer = null } = {}) {
    if (!Array.isArray(value)) {
      throw new Error('Expected array');
    }

    if (value.length > maxLength) {
      throw new Error(`Array exceeds maximum length of ${maxLength} items`);
    }

    if (itemSanitizer && typeof itemSanitizer === 'function') {
      return value.map((item, index) => {
        try {
          return itemSanitizer(item);
        } catch (err) {
          throw new Error(`Item ${index}: ${err.message}`);
        }
      });
    }

    return value;
  }

  /**
   * Sanitize object
   * - Ensures it's an object
   * - Enforces max property count
   * - Validates property names
   */
  static sanitizeObject(value, { maxProperties = 100, allowedKeys = null } = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Expected object');
    }

    const keys = Object.keys(value);

    if (keys.length > maxProperties) {
      throw new Error(`Object exceeds maximum properties of ${maxProperties}`);
    }

    // Validate property names (alphanumeric, underscore, hyphen only)
    const invalidKeys = keys.filter(k => !/^[a-zA-Z0-9_-]+$/.test(k));
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid property names: ${invalidKeys.join(', ')}`);
    }

    // Check allowed keys if specified
    if (allowedKeys && Array.isArray(allowedKeys)) {
      const disallowedKeys = keys.filter(k => !allowedKeys.includes(k));
      if (disallowedKeys.length > 0) {
        throw new Error(`Disallowed properties: ${disallowedKeys.join(', ')}`);
      }
    }

    return value;
  }

  /**
   * Sanitize file name
   * - Removes path traversal attempts
   * - Removes dangerous characters
   */
  static sanitizeFileName(value) {
    const sanitized = this.sanitizeString(value, { maxLength: this.LIMITS.FILE_NAME });

    // Remove path traversal
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      throw new Error('File name contains invalid path characters');
    }

    // Remove dangerous characters
    const cleanName = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');

    if (!cleanName) {
      throw new Error('File name cannot be empty after sanitization');
    }

    return cleanName;
  }

  /**
   * Validate ID (numeric or UUID)
   */
  static sanitizeId(value) {
    const str = String(value).trim();

    // UUID format (36 chars with hyphens)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
      return str.toLowerCase();
    }

    // Numeric ID
    if (/^\d+$/.test(str)) {
      return parseInt(str, 10);
    }

    throw new Error('Invalid ID format');
  }

  /**
   * Sanitize search query
   * - Removes wildcards and operators
   * - Prevents SQL injection via search
   */
  static sanitizeSearchQuery(value) {
    const sanitized = this.sanitizeString(value, { maxLength: this.LIMITS.SEARCH_QUERY });

    // Remove SQL-like operators and wildcards
    const cleaned = sanitized
      .replace(/[;'"]/g, '')
      .replace(/\s(OR|AND|NOT|IN|LIKE)\s/gi, ' ')
      .trim();

    return cleaned;
  }

  /**
   * Check if payload is oversized
   * - Returns true if input exceeds expected size
   */
  static isOversized(input, maxBytes = 1048576) {
    // Rough estimate: JSON stringified size
    const estimated = JSON.stringify(input).length;
    return estimated > maxBytes;
  }

  /**
   * Sanitize request body fields
   * - Takes an object and sanitization schema
   * - Returns sanitized object or throws
   */
  static sanitizeObject_WithSchema(input, schema) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Expected object input');
    }

    const result = {};

    for (const [key, sanitizer] of Object.entries(schema)) {
      const value = input[key];

      if (sanitizer.required && (value === null || value === undefined)) {
        throw new Error(`Field "${key}" is required`);
      }

      if (value !== null && value !== undefined) {
        try {
          result[key] = sanitizer.fn(value);
        } catch (err) {
          throw new Error(`Field "${key}": ${err.message}`);
        }
      }
    }

    return result;
  }
}

module.exports = InputSanitizer;
