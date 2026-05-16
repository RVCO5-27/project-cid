# Quick Reference: Input Sanitization

## 🚀 Quick Start

### 1. Install Dependency
```bash
npm install isomorphic-dompurify
```

### 2. Use in Routes
```javascript
const { validate, sanitizers } = require('../middleware/inputValidation');

router.post('/', [
  ...sanitizers.username('username'),
  ...sanitizers.email('email'),
  ...sanitizers.password('password'),
], validate, controller.create);
```

### 3. Test It
```bash
# Valid request
curl -X POST http://localhost:5000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","email":"john@example.com"}'

# Invalid request (too large)
curl -X POST http://localhost:5000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"data":"'$(python3 -c 'print("x"*2000000)')'}'  # Returns 413
```

---

## 📋 Common Sanitizers

```javascript
// String fields
...sanitizers.string('title', 100)              // Max 100 chars
...sanitizers.string('description', 5000)      // Max 5000 chars

// Username (alphanumeric + _ - .)
...sanitizers.username('username')             // 3-50 chars

// Email
...sanitizers.email('email')                   // Valid email

// Password (1-72 chars, NO trimming)
...sanitizers.password('password')

// Numeric ID
...sanitizers.id('id')                         // Or UUID

// Boolean
...sanitizers.boolean('isActive')

// URL (http/https/ftp only)
...sanitizers.url('website')

// Phone number
...sanitizers.phone('phone')                   // 10-20 chars

// Pagination
...sanitizers.pagination()                     // page + limit
...sanitizers.sort()                           // sortBy + order

// Search
...sanitizers.search('query')                  // Max 500 chars
```

---

## 🔒 What's Prevented

| Attack | Prevention |
|--------|-----------|
| **XSS** | HTML tags removed from strings |
| **SQL Injection** | Input validated as literals |
| **Path Traversal** | `../` removed from file names |
| **Null Bytes** | `\0` characters rejected |
| **Large Payloads** | 1 MB JSON limit enforced |
| **Oversized Files** | 12 MB image limit enforced |

---

## 📊 Size Limits

| Limit | Size |
|-------|------|
| JSON body | 1 MB |
| Form body | 500 KB |
| Query string | 16 KB |
| Headers | 8 KB |
| Images | 12 MB |
| Documents | 100 MB |

**Exceeded limit returns:** 413, 414, or 431 status code

---

## ❌ Making a Field Optional

```javascript
// Make any sanitizer optional
[
  ...sanitizers.string('description', 5000).map(c => c.optional()),
  ...sanitizers.email('email').map(c => c.optional()),
],
```

---

## 🧬 Direct Sanitizer Usage

```javascript
const InputSanitizer = require('../utils/inputSanitizer');

// Sanitize strings
InputSanitizer.sanitizeString(value, { maxLength: 100 })

// Sanitize username
InputSanitizer.sanitizeUsername(value)  // 3-50, alphanumeric+._-

// Sanitize email
InputSanitizer.sanitizeEmail(value)     // Valid email format

// Sanitize password
InputSanitizer.sanitizePassword(value)  // 1-72 chars

// Sanitize URL
InputSanitizer.sanitizeUrl(value)       // http/https/ftp only

// Sanitize file name
InputSanitizer.sanitizeFileName(value)  // No path traversal

// Sanitize search query
InputSanitizer.sanitizeSearchQuery(value)  // No SQL operators
```

---

## 🛡️ Error Responses

```json
// Validation error (422)
{
  "message": "Validation failed",
  "errors": [{"field": "email", "message": "Invalid email format"}]
}

// Oversized payload (413)
{
  "message": "Payload too large",
  "details": "Request body exceeds 1048576 bytes"
}

// Malformed JSON (400)
{
  "message": "Invalid JSON in request body"
}
```

---

## ✅ Best Practices

```javascript
// ✅ DO
router.post('/', [...sanitizers.email('email')], validate, handler);

// ❌ DON'T
router.post('/', handler);  // No validation!

// ✅ DO
...sanitizers.email('email')  // Use specific sanitizer

// ❌ DON'T
...sanitizers.string('email', 255)  // Too generic

// ✅ DO
...sanitizers.string('description', 5000).map(c => c.optional())

// ❌ DON'T
...sanitizers.string('description', 5000)  // Required, should be optional
```

---

## 🧪 Test Examples

```bash
# ✅ Valid
curl -X POST localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"pass123"}'

# ❌ XSS (fails with 422)
curl -X POST localhost:5000/api/schools \
  -H "Content-Type: application/json" \
  -d '{"school_name":"<script>alert(1)</script>"}'

# ❌ Oversized (fails with 413)
curl -X POST localhost:5000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"data":"'$(yes | head -c 10M)'"}' 

# ❌ Invalid email (fails with 422)
curl -X POST localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email"}'

# ❌ Malformed JSON (fails with 400)
curl -X POST localhost:5000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{invalid}'
```

---

## 📁 File Organization

```
backend/
├── utils/
│   └── inputSanitizer.js          ← Core sanitization
├── middleware/
│   ├── inputValidation.js         ← Express-validator integration
│   └── requestSizeLimiter.js      ← Size limiting
├── routes/
│   ├── auth.js                    ← With validation ✅
│   ├── upload.js                  ← With validation ✅
│   ├── schools.js                 ← With validation ✅
│   └── admin.js                   ← Needs validation ⏳
├── server.js                      ← Middleware configured ✅
├── INPUT_SANITIZATION_GUIDE.md    ← Full docs
└── INPUT_SANITIZATION_CHECKLIST.md ← Checklist
```

---

## 🔗 More Info

- Full Guide: [INPUT_SANITIZATION_GUIDE.md](./backend/INPUT_SANITIZATION_GUIDE.md)
- Checklist: [INPUT_SANITIZATION_CHECKLIST.md](./backend/INPUT_SANITIZATION_CHECKLIST.md)
- Implementation: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

**Remember:** Always use sanitizers! It's automatic and protects your application.
