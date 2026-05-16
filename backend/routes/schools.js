const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { param, query } = require('express-validator');
const schoolController = require('../controllers/schoolController');
const { authMiddleware, requireAdminRole } = require('../middleware/auth');
const { validate, sanitizers, InputSanitizer } = require('../middleware/inputValidation');
const { LIMITS } = require('../middleware/requestSizeLimiter');

/**
 * School Management Routes
 * Public read, admin write
 * All inputs are validated and sanitized
 */

const schoolLogoDir = path.join(__dirname, '../uploads/schools');
const schoolLogoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(schoolLogoDir, { recursive: true });
      cb(null, schoolLogoDir);
    },
    filename: (req, file, cb) => {
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/bmp': '.bmp',
      };
      const ext = mimeToExt[file.mimetype] || path.extname(file.originalname) || '.png';
      const sanitizedId = String(req.params.id).replace(/[^0-9]/g, '');
      cb(null, `school_${sanitizedId}_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, WebP, BMP allowed.'));
  },
});

// Public (read-only) - GET all schools with pagination and filtering
router.get(
  '/',
  [
    ...sanitizers.search('search'),
    ...sanitizers.pagination(),
    ...sanitizers.sort(),
    query('type')
      .optional()
      .trim()
      .matches(/^[a-zA-Z0-9\s_-]+$/)
      .withMessage('Invalid school type'),
  ],
  validate,
  schoolController.getAllSchools
);

// Public (read-only) - GET school by ID
router.get(
  '/:id',
  [
    param('id')
      .matches(/^\d+$/)
      .withMessage('Invalid school ID format'),
  ],
  validate,
  schoolController.getSchoolById
);

// Export endpoints (static routes before :id routes)
router.get(
  '/export/excel',
  authMiddleware,
  requireAdminRole,
  [
    query('type')
      .optional()
      .trim()
      .matches(/^[a-zA-Z0-9\s_-]+$/)
      .withMessage('Invalid school type'),
  ],
  validate,
  schoolController.exportExcel
);

router.get(
  '/export/pdf',
  authMiddleware,
  requireAdminRole,
  [
    query('type')
      .optional()
      .trim()
      .matches(/^[a-zA-Z0-9\s_-]+$/)
      .withMessage('Invalid school type'),
  ],
  validate,
  schoolController.exportPDF
);

// Admin (write) - POST create new school
router.post(
  '/',
  authMiddleware,
  requireAdminRole,
  [
    ...sanitizers.string('school_id', 20),
    ...sanitizers.string('school_name', 100),
    ...sanitizers.string('school_type', 50),
    ...sanitizers.string('principal_name', 100),
    ...sanitizers.integer('year_started'),
    sanitizers.string('description', InputSanitizer.LIMITS.DESCRIPTION)[0].optional(),
  ],
  validate,
  schoolController.createSchool
);

// Admin (write) - PUT update school
router.put(
  '/:id',
  authMiddleware,
  requireAdminRole,
  [
    param('id')
      .matches(/^\d+$/)
      .withMessage('Invalid school ID format'),
    ...sanitizers.string('school_name', 100).map(c => c.optional()),
    ...sanitizers.string('school_type', 50).map(c => c.optional()),
    ...sanitizers.string('principal_name', 100).map(c => c.optional()),
    ...sanitizers.integer('year_started').map(c => c.optional()),
  ],
  validate,
  schoolController.updateSchool
);

// Admin (write) - POST upload school logo
router.post(
  '/:id/logo',
  authMiddleware,
  requireAdminRole,
  [
    param('id')
      .matches(/^\d+$/)
      .withMessage('Invalid school ID format'),
  ],
  validate,
  (req, res, next) => {
    schoolLogoUpload.single('logo')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message: 'Logo upload failed',
          details: err.message || 'Invalid file',
        });
      }
      next();
    });
  },
  schoolController.uploadSchoolLogo
);

// Admin (write) - DELETE school
router.delete(
  '/:id',
  authMiddleware,
  requireAdminRole,
  [
    param('id')
      .matches(/^\d+$/)
      .withMessage('Invalid school ID format'),
  ],
  validate,
  schoolController.deleteSchool
);

module.exports = router;
