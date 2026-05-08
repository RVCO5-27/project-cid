const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const authController = require('../controllers/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authLoginLimiter } = require('../middleware/authRateLimiter');
const { authMiddleware, requireAdminRole } = require('../middleware/auth');

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
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, WebP, BMP allowed.'));
    }
  },
});

router.post(
  '/login',
  authLoginLimiter,
  [
    check('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ max: 50 })
      .withMessage('Username is too long'),
    check('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ max: 72 })
      .withMessage('Password is too long'),
  ],
  validate,
  authController.login
);

router.post(
  '/recovery/consume',
  [check('token').trim().notEmpty().matches(/^[a-fA-F0-9]{64}$/)],
  validate,
  authController.consumeRecovery
);

router.post(
  '/change-password',
  authMiddleware,
  [
    check('newPassword').notEmpty().isLength({ min: 1, max: 72 }),
    check('currentPassword').optional().isLength({ max: 72 }),
  ],
  validate,
  authController.changePassword
);

router.post('/logout', authController.logout);

router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/recovery/test', authMiddleware, requireAdminRole, requireSuperAdmin, authController.sendTestRecoveryEmail);
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

