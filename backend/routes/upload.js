const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdminRole } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');
const { LIMITS } = require('../middleware/requestSizeLimiter');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for general file uploads with size and type validation
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const sanitizedName = path.basename(file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 255);
      cb(null, `${Date.now()}_${sanitizedName}`);
    },
  }),
  limits: {
    fileSize: LIMITS.FILE_UPLOAD_GENERAL,
  },
  fileFilter: (req, file, cb) => {
    // Whitelist allowed file types
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed`));
    }

    // Validate file name
    const filename = path.basename(file.originalname);
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return cb(new Error('File name contains invalid characters'));
    }

    cb(null, true);
  },
});

// POST /api/upload - Upload a file (admin only)
router.post(
  '/',
  authMiddleware,
  requireAdminRole,
  fileUpload.single('file'),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded',
      });
    }
    uploadController.uploadFile(req, res, next);
  }
);

module.exports = router;


