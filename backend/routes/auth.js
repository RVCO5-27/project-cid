const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const authController = require('../controllers/auth');
const { validate, sanitizers } = require('../middleware/inputValidation');
const { authLoginLimiter } = require('../middleware/authRateLimiter');
const { authMiddleware, requireAdminRole } = require('../middleware/auth');
const { LIMITS } = require('../middleware/requestSizeLimiter');

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

const avatarsDir = path.join(__dirname, '../uploads/avatars');
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(avatarsDir, { recursive: true });
      cb(null, avatarsDir);
    },
    filename: (req, file, cb) => {
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/bmp': '.bmp',
      };
      const ext = mimeToExt[file.mimetype] || path.extname(file.originalname) || '.jpg';
      cb(null, `${req.user.id}-avatar${ext}`);
    },
  }),
  limits: { fileSize: LIMITS.FILE_UPLOAD_IMAGE },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, WebP, BMP allowed.'));
    }
  },
});

// POST /api/auth/login - User login with rate limiting
router.post(
  '/login',
  authLoginLimiter,
  [
    ...sanitizers.username('username'),
    ...sanitizers.password('password'),
  ],
  validate,
  authController.login
);

// POST /api/auth/recovery/consume - Consume recovery token
router.post(
  '/recovery/consume',
  [
    require('../middleware/inputValidation').check('token')
      .trim()
      .matches(/^[a-fA-F0-9]{64}$/)
      .withMessage('Invalid recovery token format'),
  ],
  validate,
  authController.consumeRecovery
);

// POST /api/auth/change-password - Change password
router.post(
  '/change-password',
  authMiddleware,
  [
    ...sanitizers.password('newPassword'),
    ...sanitizers.password('currentPassword'),
  ],
  validate,
  authController.changePassword
);

// POST /api/auth/logout - Logout
router.post('/logout', authController.logout);

// GET /api/auth/profile - Get user profile
router.get('/profile', authMiddleware, authController.getProfile);

// PUT /api/auth/profile - Update user profile
router.put('/profile', authMiddleware, authController.updateProfile);

// POST /api/auth/recovery/test - Send test recovery email (SuperAdmin only)
router.post(
  '/recovery/test',
  authMiddleware,
  requireAdminRole,
  requireSuperAdmin,
  authController.sendTestRecoveryEmail
);

// POST /api/auth/avatar - Upload user avatar
router.post(
  '/avatar',
  authMiddleware,
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err) => {
      if (err) {
        const msg = err.message || 'Upload failed';
        return res.status(400).json({ message: msg });
      }
      next();
    });
  },
  authController.uploadAvatar
);

module.exports = router;

