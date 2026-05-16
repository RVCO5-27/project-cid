/**
 * Enhanced Validation Middleware
 * Provides comprehensive input validation with sanitization,
 * oversized payload rejection, and malformed data handling
 */

const { validationResult, body, query, param, check } = require('express-validator');
const InputSanitizer = require('../utils/inputSanitizer');

/**
 * Main validation error handler middleware
 * Checks for validation errors and returns detailed error responses
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: process.env.NODE_ENV !== 'production' ? err.value : undefined,
      })),
    });
  }
  next();
};

/**
 * Middleware to check for oversized payloads before processing
 * Rejects requests if JSON/form body exceeds max size
 */
const checkPayloadSize = (maxBytes = 1048576) => {
  return (req, res, next) => {
    // Check Content-Length header
    const contentLength = parseInt(req.headers['content-length'] || 0);
    if (contentLength > maxBytes) {
      return res.status(413).json({
        message: 'Payload too large',
        details: `Request body exceeds ${maxBytes} bytes (received ${contentLength} bytes)`,
      });
    }

    // Check parsed body size for extra safety
    if (req.body && typeof req.body === 'object') {
      try {
        const bodySize = JSON.stringify(req.body).length;
        if (bodySize > maxBytes) {
          return res.status(413).json({
            message: 'Payload too large',
            details: `Request body exceeds ${maxBytes} bytes (received ${bodySize} bytes)`,
          });
        }
      } catch (err) {
        // Continue if stringification fails, will be caught by other middleware
      }
    }

    next();
  };
};

/**
 * Middleware to reject malformed JSON
 */
const rejectMalformedJson = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Malformed JSON in request body',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
  next(err);
};

/**
 * Middleware to reject malformed URL parameters
 */
const validateMalformedParams = (req, res, next) => {
  try {
    // Check for suspicious patterns in URL params
    for (const [key, value] of Object.entries(req.query || {})) {
      if (typeof value === 'string') {
        // Check for null bytes
        if (value.includes('\0')) {
          return res.status(400).json({
            message: 'Malformed query parameters',
            details: 'Query parameters contain null bytes',
          });
        }

        // Check for excessive size
        if (value.length > 10000) {
          return res.status(400).json({
            message: 'Query parameter too large',
            details: `Query parameter "${key}" exceeds maximum length`,
          });
        }
      }
    }

    // Check path parameters
    for (const [key, value] of Object.entries(req.params || {})) {
      if (typeof value === 'string' && value.includes('\0')) {
        return res.status(400).json({
          message: 'Malformed path parameters',
          details: 'Path parameters contain null bytes',
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Create sanitized field validators for common patterns
 */
const sanitizers = {
  // String field with custom max length
  string: (field, maxLength = 1000) => [
    check(field)
      .trim()
      .isLength({ min: 1, max: maxLength })
      .withMessage(`${field} must be between 1 and ${maxLength} characters`)
      .customSanitizer(value => InputSanitizer.sanitizeString(value, { maxLength })),
  ],

  // Username field
  username: (field = 'username') => [
    check(field)
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage('Username can only contain alphanumeric characters, dots, underscores, or hyphens')
      .customSanitizer(value => InputSanitizer.sanitizeUsername(value)),
  ],

  // Email field
  email: (field = 'email') => [
    check(field)
      .trim()
      .isEmail()
      .withMessage('Invalid email format')
      .isLength({ max: 254 })
      .withMessage('Email is too long')
      .normalizeEmail()
      .customSanitizer(value => InputSanitizer.sanitizeEmail(value)),
  ],

  // Password field
  password: (field = 'password') => [
    check(field)
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 1, max: 72 })
      .withMessage('Password must be between 1 and 72 characters')
      .customSanitizer(value => InputSanitizer.sanitizePassword(value)),
  ],

  // Numeric ID
  id: (field = 'id') => [
    param(field)
      .matches(/^\d+$/)
      .withMessage(`${field} must be a valid numeric ID`)
      .customSanitizer(value => InputSanitizer.sanitizeInteger(value)),
  ],

  // Integer field
  integer: (field, options = {}) => [
    check(field)
      .isInt(options)
      .withMessage(`${field} must be a valid integer`)
      .customSanitizer(value => InputSanitizer.sanitizeInteger(value)),
  ],

  // Boolean field
  boolean: (field) => [
    check(field)
      .customSanitizer(value => InputSanitizer.sanitizeBoolean(value))
      .isBoolean()
      .withMessage(`${field} must be a boolean`),
  ],

  // URL field
  url: (field, options = {}) => [
    check(field)
      .isURL(options)
      .withMessage(`${field} must be a valid URL`)
      .customSanitizer(value => InputSanitizer.sanitizeUrl(value)),
  ],

  // Phone number
  phone: (field = 'phone') => [
    check(field)
      .trim()
      .isLength({ min: 10, max: 20 })
      .withMessage('Phone number must be between 10 and 20 characters')
      .customSanitizer(value => InputSanitizer.sanitizePhoneNumber(value)),
  ],

  // Search query
  search: (field = 'search') => [
    query(field)
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Search query is too long')
      .customSanitizer(value => InputSanitizer.sanitizeSearchQuery(value)),
  ],

  // File name
  fileName: (field = 'filename') => [
    check(field)
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('File name must be between 1 and 255 characters')
      .customSanitizer(value => InputSanitizer.sanitizeFileName(value)),
  ],

  // Pagination fields
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .customSanitizer(value => InputSanitizer.sanitizeInteger(value)),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 500 })
      .withMessage('Limit must be between 1 and 500')
      .customSanitizer(value => InputSanitizer.sanitizeInteger(value)),
  ],

  // Sorting fields
  sort: () => [
    query('sortBy')
      .optional()
      .trim()
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .trim()
      .matches(/^(ASC|DESC)$/i)
      .withMessage('Order must be ASC or DESC'),
  ],
};

module.exports = {
  validate,
  checkPayloadSize,
  rejectMalformedJson,
  validateMalformedParams,
  sanitizers,
  InputSanitizer,
  // Also export express-validator for advanced usage
  check,
  body,
  query,
  param,
};
