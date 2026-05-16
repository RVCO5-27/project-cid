/**
 * Request Size Limiting Middleware
 * Provides comprehensive size limits for different types of requests
 */

/**
 * Create a size limit middleware
 * @param {number} maxSize - Maximum size in bytes
 * @param {string} message - Custom error message
 */
const createSizeLimitMiddleware = (maxSize, message) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || 0);

    if (contentLength > maxSize) {
      return res.status(413).json({
        message: message || 'Request entity too large',
        details: `Request size ${contentLength} bytes exceeds limit of ${maxSize} bytes`,
      });
    }

    next();
  };
};

/**
 * Size limits for different types of requests
 */
const LIMITS = {
  // JSON/Form bodies - 1MB by default
  JSON_BODY: 1 * 1024 * 1024,

  // URL-encoded forms - 500KB
  FORM_BODY: 500 * 1024,

  // File uploads - varies by endpoint
  FILE_UPLOAD_GENERAL: 50 * 1024 * 1024,
  FILE_UPLOAD_IMAGE: 12 * 1024 * 1024,
  FILE_UPLOAD_DOCUMENT: 100 * 1024 * 1024,

  // Query string - 16KB
  QUERY_STRING: 16 * 1024,

  // Single header - 8KB
  HEADER: 8 * 1024,
};

/**
 * Validate query string size
 */
const validateQueryStringSize = (maxSize = LIMITS.QUERY_STRING) => {
  return (req, res, next) => {
    const queryString = req.url.split('?')[1] || '';
    if (queryString.length > maxSize) {
      return res.status(414).json({
        message: 'URI too long',
        details: `Query string exceeds ${maxSize} bytes`,
      });
    }
    next();
  };
};

/**
 * Validate header sizes
 */
const validateHeaderSize = (maxSize = LIMITS.HEADER) => {
  return (req, res, next) => {
    const headers = req.headers;
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string' && value.length > maxSize) {
        return res.status(431).json({
          message: 'Request header fields too large',
          details: `Header "${key}" exceeds maximum size`,
        });
      }
    }
    next();
  };
};

/**
 * Reject requests with no content-type for POST/PUT/PATCH
 */
const requireContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType) {
      return res.status(400).json({
        message: 'Content-Type header is required',
      });
    }
  }
  next();
};

/**
 * Reject requests with suspicious content types
 */
const validateContentType = (allowedTypes = ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']) => {
  return (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      if (contentType) {
        // Extract just the media type (before semicolon)
        const mediaType = contentType.split(';')[0].trim();

        if (!allowedTypes.some(type => mediaType === type || mediaType.startsWith(type))) {
          return res.status(415).json({
            message: 'Unsupported media type',
            details: `Content-Type "${mediaType}" is not supported`,
          });
        }
      }
    }
    next();
  };
};

/**
 * Reject requests with duplicate headers (except allowed ones)
 * Duplicate headers can be used for HTTP parameter pollution attacks
 */
const rejectDuplicateHeaders = (allowedDuplicates = ['set-cookie']) => {
  return (req, res, next) => {
    const rawHeaders = req.rawHeaders || [];
    const headerMap = {};

    for (let i = 0; i < rawHeaders.length; i += 2) {
      const headerName = rawHeaders[i].toLowerCase();
      if (!allowedDuplicates.includes(headerName)) {
        if (headerMap[headerName]) {
          return res.status(400).json({
            message: 'Invalid request headers',
            details: `Duplicate header detected: ${headerName}`,
          });
        }
        headerMap[headerName] = true;
      }
    }
    next();
  };
};

/**
 * Middleware to enforce strict request method validation
 */
const strictMethodValidation = (req, res, next) => {
  const validMethods = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  if (!validMethods.includes(req.method)) {
    return res.status(405).json({
      message: 'Method not allowed',
      details: `HTTP method ${req.method} is not supported`,
    });
  }
  next();
};

/**
 * Express middleware for JSON parse errors
 * Note: This should be used with express.json()
 */
const handleJsonParseError = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Invalid JSON in request body',
      details: process.env.NODE_ENV !== 'production' ? err.message : 'Request body contains invalid JSON',
    });
  }
  next(err);
};

module.exports = {
  createSizeLimitMiddleware,
  LIMITS,
  validateQueryStringSize,
  validateHeaderSize,
  requireContentType,
  validateContentType,
  rejectDuplicateHeaders,
  strictMethodValidation,
  handleJsonParseError,
};
