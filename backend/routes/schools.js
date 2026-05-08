const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const schoolController = require('../controllers/schoolController');
const { authMiddleware, requireAdminRole } = require('../middleware/auth');

/**
 * School Management Routes
 * Public read, admin write
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
      cb(null, `school_${req.params.id}_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, WebP, BMP allowed.'));
  },
});

// Public (read-only)
router.get('/', schoolController.getAllSchools);
router.get('/:id', schoolController.getSchoolById);

// Export endpoints (static routes before :id routes)
router.get('/export/excel', authMiddleware, requireAdminRole, schoolController.exportExcel);
router.get('/export/pdf', authMiddleware, requireAdminRole, schoolController.exportPDF);

// Admin (write)
router.post('/', authMiddleware, requireAdminRole, schoolController.createSchool);
router.put('/:id', authMiddleware, requireAdminRole, schoolController.updateSchool);
router.post('/:id/logo', authMiddleware, requireAdminRole, (req, res, next) => {
  schoolLogoUpload.single('logo')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload failed' });
    next();
  });
}, schoolController.uploadSchoolLogo);
router.delete('/:id', authMiddleware, requireAdminRole, schoolController.deleteSchool);

module.exports = router;

