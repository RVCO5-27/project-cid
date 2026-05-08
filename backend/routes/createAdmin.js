const express = require('express');
const rateLimit = require('express-rate-limit');
const { check } = require('express-validator');
const { validate } = require('../middleware/validate');
const createAdminController = require('../controllers/createAdmin');

const router = express.Router();

const createAdminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

router.get('/status', createAdminController.status);

router.post(
  '/',
  createAdminLimiter,
  [
    check('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Username must be 1–50 characters'),
    check('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isLength({ max: 100 })
      .withMessage('Email is too long')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    check('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ max: 72 })
      .withMessage('Password is too long'),
  ],
  validate,
  createAdminController.createAdmin
);

module.exports = router;

