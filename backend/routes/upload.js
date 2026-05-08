const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdminRole } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

router.post('/', authMiddleware, requireAdminRole, uploadController.upload.single('file'), uploadController.uploadFile);

module.exports = router;

