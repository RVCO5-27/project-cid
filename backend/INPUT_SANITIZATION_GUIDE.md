# Input Sanitization & Payload Validation Guide

## Overview

This document describes the comprehensive input sanitization and payload validation system implemented to protect the application from injection attacks, oversized requests, and malformed data.

---

## Architecture

### Components

1. **InputSanitizer** (`backend/utils/inputSanitizer.js`)
   - Core sanitization logic for all input types
   - Prevents injection attacks, null bytes, control characters
   - Enforces field-specific constraints

2. **Input Validation Middleware** (`backend/middleware/inputValidation.js`)
   - Express-validator integration with sanitization
   - Pre-built validators for common patterns
   - Comprehensive error reporting

3. **Request Size Limiting** (`backend/middleware/requestSizeLimiter.js`)
   - Enforces payload size limits
   - Validates headers, query strings, and content types
   - Detects oversized and malformed requests

4. **Enhanced Server Configuration** (`backend/server.js`)
   - Applied all validation middleware in correct order
   - Configured appropriate limits for each payload type
   - Error handling for malformed data

---

## Payload Size Limits

All limits are enforced at the middleware level and will reject requests that exceed them:

```javascript
{
  JSON_BODY: 1 * 1024 * 1024,              // 1 MB
  FORM_BODY: 500 * 1024,                   // 500 KB
  FILE_UPLOAD_GENERAL: 50 * 1024 * 1024,  // 50 MB
  FILE_UPLOAD_IMAGE: 12 * 1024 * 1024,    // 12 MB
  FILE_UPLOAD_DOCUMENT: 100 * 1024 * 1024, // 100 MB
  QUERY_STRING: 16 * 1024,                 // 16 KB
  HEADER: 8 * 1024,                        // 8 KB
}
```

**Responses for oversized payloads:**
- 413 Payload Too Large - Request body exceeds limit
- 414 URI Too Long - Query string exceeds limit
- 431 Request Header Fields Too Large - Header exceeds limit

---

## Input Sanitization Features

### String Sanitization

```javascript
InputSanitizer.sanitizeString(value, { maxLength: 1000 })
```

- Trims whitespace
- Removes HTML/script tags using DOMPurify
- Rejects null bytes (`\0`)
- Enforces maximum length
- Returns clean string or throws error

**Example:**
```javascript
InputSanitizer.sanitizeString('<script>alert("xss")</script>', { maxLength: 100 });
// Output: "" (empty after HTML removal)
```

### Username Validation

```javascript
InputSanitizer.sanitizeUsername(value)
```

- Alphanumeric, dots, underscores, hyphens only
- Length: 3-50 characters
- Rejects suspicious patterns

**Rules:**
- ✅ Valid: `john_doe`, `user.123`, `admin-user`
- ❌ Invalid: `user@domain`, `<script>`, `a` (too short)

### Email Validation

```javascript
InputSanitizer.sanitizeEmail(value)
```

- RFC 5322 basic validation
- Max 254 characters
- Converts to lowercase
- Rejects obviously invalid formats

**Rules:**
- ✅ Valid: `user@example.com`, `test.user+tag@domain.co.uk`
- ❌ Invalid: `invalid@`, `@domain.com`, `user space@domain.com`

### Password Handling

```javascript
InputSanitizer.sanitizePassword(value)
```

- **NO trimming** - preserves user intent
- Max 72 characters (bcryptjs limit)
- Rejects null bytes and control characters
- Does NOT validate strength (done separately)

**Important:**
- Passwords are NOT HTML-sanitized
- Original password bytes preserved for bcrypt
- Length validation: 1-72 characters

### Numeric ID Validation

```javascript
InputSanitizer.sanitizeId(value)
```

- Accepts numeric IDs or UUIDs
- Rejects path traversal attempts
- Returns parsed integer or lowercase UUID

**Rules:**
- ✅ Valid: `123`, `550e8400-e29b-41d4-a716-446655440000`
- ❌ Invalid: `123abc`, `../../../etc/passwd`

### URL Validation

```javascript
InputSanitizer.sanitizeUrl(value)
```

- Validates URL format using URL constructor
- Whitelist protocols: `http`, `https`, `ftp`, `ftps`
- Rejects `javascript:` and `data:` URLs
- Max 2048 characters

**Rules:**
- ✅ Valid: `https://example.com/path`, `http://localhost:3000`
- ❌ Invalid: `javascript:alert(1)`, `data:text/html,<script>`

### File Name Sanitization

```javascript
InputSanitizer.sanitizeFileName(value)
```

- Removes path traversal attempts (`..`, `/`, `\`)
- Removes dangerous characters: `<>:"|?*\x00-\x1f`
- Max 255 characters
- Essential for file uploads

**Rules:**
- ✅ Valid: `document.pdf`, `my-file_v2.xlsx`
- ❌ Invalid: `../../../etc/passwd`, `<script>.txt`, `file\x00.pdf`

### Search Query Sanitization

```javascript
InputSanitizer.sanitizeSearchQuery(value)
```

- Removes SQL operators: `OR`, `AND`, `NOT`, `IN`, `LIKE`
- Removes quotes and semicolons
- Max 500 characters
- Prevents SQL injection in search parameters

**Rules:**
- ✅ Valid: `search term`, `user name filter`
- ❌ Invalid: `'; DROP TABLE users; --`, `admin' OR '1'='1`

### JSON Field Validation

```javascript
InputSanitizer.sanitizeJson(value, { maxLength: 50000 })
```

- Validates JSON format
- Enforces max size
- Useful for complex nested objects

**Example:**
```javascript
const data = '{"key": "value", "nested": {"count": 42}}';
InputSanitizer.sanitizeJson(data);
// Output: '{"key": "value", "nested": {"count": 42}}'
```

### Array Sanitization

```javascript
InputSanitizer.sanitizeArray(value, {
  maxLength: 1000,
  itemSanitizer: (item) => InputSanitizer.sanitizeString(item)
})
```

- Validates array type
- Enforces max item count
- Optionally sanitizes each element

**Example:**
```javascript
const items = ['user1', 'user2', 'user3'];
InputSanitizer.sanitizeArray(items, { maxLength: 10 });
// Output: ['user1', 'user2', 'user3']
```

### Object Validation

```javascript
InputSanitizer.sanitizeObject(value, {
  maxProperties: 100,
  allowedKeys: ['name', 'email', 'phone']
})
```

- Validates object structure
- Enforces property count limits
- Validates property names (alphanumeric, underscore, hyphen)
- Optional whitelist of allowed keys

---

## Using Validation Middleware

### Pre-Built Sanitizers

The `inputValidation.js` module exports ready-to-use sanitizer chains:

```javascript
const { sanitizers, validate } = require('../middleware/inputValidation');

// String fields
sanitizers.string('description', 5000)        // Custom max length
sanitizers.string('title')                    // Default 1000 chars

// Username
sanitizers.username('username')               // 3-50 chars, alphanumeric+._-

// Email
sanitizers.email('email')                     // Valid email format

// Password
sanitizers.password('password')               // 1-72 chars

// Numeric/UUID ID
sanitizers.id('id')                           // Numeric or UUID

// Boolean
sanitizers.boolean('isActive')                // true/false

// URL
sanitizers.url('website')                     // Valid HTTP/HTTPS URL

// Phone
sanitizers.phone('phone')                     // Phone number format

// Pagination
sanitizers.pagination()                       // page + limit validation

// Sorting
sanitizers.sort()                             // sortBy + order validation

// Search
sanitizers.search('q')                        // Search query sanitization
```

### Example: Using in Routes

```javascript
const express = require('express');
const router = express.Router();
const { validate, sanitizers } = require('../middleware/inputValidation');

// Create user endpoint
router.post(
  '/',
  [
    ...sanitizers.username('username'),
    ...sanitizers.email('email'),
    ...sanitizers.password('password'),
    ...sanitizers.string('firstName', 100),
    ...sanitizers.string('lastName', 100),
  ],
  validate,
  controller.createUser
);

// Get users with pagination
router.get(
  '/',
  [
    ...sanitizers.search('search'),
    ...sanitizers.pagination(),
  ],
  validate,
  controller.getUsers
);

// Update user
router.put(
  '/:id',
  [
    ...sanitizers.id('id'),
    ...sanitizers.email('email').map(c => c.optional()),
    ...sanitizers.string('firstName', 100).map(c => c.optional()),
  ],
  validate,
  controller.updateUser
);
```

---

## Request Validation Middleware Pipeline

The middleware runs in this order (important for security):

```
1. CORS check
2. strictMethodValidation           - Reject invalid HTTP methods
3. validateQueryStringSize          - Reject large query strings (>16KB)
4. validateHeaderSize               - Reject large headers (>8KB)
5. requireContentType               - Require Content-Type for POST/PUT/PATCH
6. validateContentType              - Only allow whitelisted content types
7. rejectDuplicateHeaders           - Prevent HTTP parameter pollution
8. express.json()                   - Parse JSON (1MB limit)
9. express.urlencoded()             - Parse forms (500KB limit)
10. handleJsonParseError            - Handle malformed JSON
11. validateMalformedParams         - Check URL/query params for null bytes
12. checkPayloadSize                - Final payload size check
```

---

## File Upload Validation

### Image Upload Limits

```javascript
limits: {
  fileSize: 12 * 1024 * 1024  // 12 MB max
},
fileFilter: (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'));
  }
  cb(null, true);
}
```

### File Name Sanitization

File names are sanitized during upload:

```javascript
// Before: `my document (1) [DRAFT].pdf`
// After:  `1715000000000_my_document__1__DRAFT_.pdf`
```

---

## Error Responses

### Validation Errors (422 Unprocessable Entity)

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "not-an-email"  // Only in development
    },
    {
      "field": "password",
      "message": "Password must be between 1 and 72 characters"
    }
  ]
}
```

### Oversized Payload (413 Payload Too Large)

```json
{
  "message": "Payload too large",
  "details": "Request body exceeds 1048576 bytes (received 2097152 bytes)"
}
```

### Malformed JSON (400 Bad Request)

```json
{
  "message": "Invalid JSON in request body",
  "details": "Unexpected token } in JSON at position 42"  // Dev only
}
```

### Malformed Query Parameters (400 Bad Request)

```json
{
  "message": "Malformed query parameters",
  "details": "Query parameters contain null bytes"
}
```

---

## Common Attack Patterns Prevented

### 1. SQL Injection

```sql
-- Attacker input
username=admin' OR '1'='1
password=' OR '1'='1'--

-- Sanitized:
username="admin' OR '1'='1"  (treated as literal string)
password="' OR '1'='1'--"    (treated as literal string)
```

### 2. Cross-Site Scripting (XSS)

```html
<!-- Attacker input -->
description=<script>alert('xss')</script>

<!-- After sanitization -->
description=""  (HTML stripped)
```

### 3. Path Traversal

```
<!-- Attacker input -->
fileName=../../etc/passwd
fileName=..\..\..\windows\system32\config\sam

<!-- Sanitized -->
fileName="etcpasswd"  (path separators removed)
fileName="..windowssystem32configsam"  (removed)
```

### 4. Null Byte Injection

```
<!-- Attacker input -->
username=admin\0
query=search\x00<malicious>

<!-- Result -->
Rejected (null bytes not allowed)
```

### 5. HTTP Parameter Pollution

```
<!-- Attacker crafts multiple headers -->
Content-Type: application/json
Content-Type: application/x-www-form-urlencoded

<!-- Result -->
Rejected (duplicate header detected)
```

### 6. Oversized Payload DoS

```
<!-- Attacker sends 500MB JSON body -->
Content-Length: 524288000
{...}

<!-- Result -->
413 Payload Too Large (rejected before processing)
```

---

## Best Practices for Developers

### ✅ DO

1. **Always use sanitizers** in route validation chains
   ```javascript
   router.post('/users', [...sanitizers.email('email')], validate, handler);
   ```

2. **Use specific sanitizers** for field types
   ```javascript
   // Good
   ...sanitizers.email('email')
   
   // Avoid generic
   ...sanitizers.string('email', 255)
   ```

3. **Chain multiple validators** for complex validation
   ```javascript
   [
     ...sanitizers.string('title', 100),
     check('title').notEmpty().withMessage('Title cannot be empty'),
     check('title').isLength({ min: 5 }).withMessage('Title too short'),
   ]
   ```

4. **Make optional fields optional**
   ```javascript
   ...sanitizers.string('description', 5000).map(c => c.optional())
   ```

5. **Document field limits** in code comments
   ```javascript
   // POST /users - Create user (max 1KB JSON body)
   // Fields: username (3-50), email (max 254), password (1-72)
   ```

### ❌ DON'T

1. **Don't skip validation** for any endpoint
   ```javascript
   // Bad - no validation
   router.post('/users', handler);
   
   // Good
   router.post('/users', [...sanitizers.email('email')], validate, handler);
   ```

2. **Don't use generic strings** for structured data
   ```javascript
   // Bad
   check('email').isLength({ max: 255 })
   
   // Good
   ...sanitizers.email('email')
   ```

3. **Don't trust Content-Type header** alone
   ```javascript
   // Middleware already validates this, don't add custom content-type checks
   ```

4. **Don't disable validation for testing**
   ```javascript
   // Always validate, even in tests
   // Use proper test data that passes validation
   ```

5. **Don't expose internal details** in error messages
   ```javascript
   // Bad (production)
   "SQL syntax error: unexpected token 'X' at position 42"
   
   // Good
   "Invalid request data"
   ```

---

## Testing Input Sanitization

### Test Invalid Inputs

```javascript
describe('Input Sanitization', () => {
  it('should reject XSS attempts', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
      });
    expect(res.status).toBe(422);
  });

  it('should reject oversized payloads', async () => {
    const largeString = 'a'.repeat(10 * 1024 * 1024);
    const res = await request(app)
      .post('/api/users')
      .send({ data: largeString });
    expect(res.status).toBe(413);
  });

  it('should reject null bytes', async () => {
    const res = await request(app)
      .get('/api/search?q=test\0data');
    expect(res.status).toBe(400);
  });
});
```

---

## Monitoring & Logging

Enable security logging to track validation failures:

```javascript
// Log validation errors for monitoring
app.use((req, res, next) => {
  if (req._validationErrors) {
    console.warn('[SECURITY] Validation failure:', {
      path: req.path,
      method: req.method,
      errors: req._validationErrors,
      ip: req.ip,
    });
  }
  next();
});
```

---

## Troubleshooting

### Issue: Valid input rejected

**Cause:** Too restrictive validation rules

**Solution:** Review field limits in sanitizer, adjust if needed:
```javascript
// If title needs > 100 chars:
...sanitizers.string('title', 500)  // Increase from 100 to 500
```

### Issue: Legitimate URLs rejected

**Cause:** Protocol not whitelisted

**Solution:** Check `sanitizeUrl()` allowed protocols:
```javascript
// Add custom protocol validation for special URLs:
check('url')
  .matches(/^(https?|ftp):\/\//)
  .withMessage('Only HTTP, HTTPS, FTP allowed')
```

### Issue: File uploads rejected

**Cause:** File size or type limits

**Solution:** Adjust multer limits:
```javascript
limits: {
  fileSize: 50 * 1024 * 1024  // Increase from 12MB to 50MB
}
```

---

## Related Documentation

- [SECURITY_GUIDE.md](../SECURITY_GUIDE.md) - Environment variables & secrets
- [SECURITY_SUMMARY.md](../SECURITY_SUMMARY.md) - Security audit results
- [middleware/inputValidation.js](../middleware/inputValidation.js) - Validation implementation
- [utils/inputSanitizer.js](../utils/inputSanitizer.js) - Sanitization logic
- [middleware/requestSizeLimiter.js](../middleware/requestSizeLimiter.js) - Size limiting

---

## Dependencies

- `express-validator` (^7.3.1) - Validation & sanitization
- `isomorphic-dompurify` - HTML sanitization (XSS prevention)

Install with:
```bash
npm install isomorphic-dompurify
```

---

## Maintenance

### Regular Reviews

- Review validation rules quarterly
- Update limits based on usage patterns
- Test with new attack patterns

### Version Updates

When updating express-validator or dependencies:
1. Test all validation chains
2. Verify error messages still work
3. Check for new security options

---

## Questions?

For security concerns or questions about input sanitization, refer to:
1. This document
2. SECURITY_GUIDE.md
3. Individual middleware source files
4. Express-validator documentation: https://express-validator.github.io/
