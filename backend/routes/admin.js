const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdminRole } = require('../middleware/auth');

router.use(authMiddleware);
router.use(requireAdminRole);

router.use('/users', require('./adminManagement'));
router.use('/issuances-mgmt', require('./issuances_admin'));

module.exports = router;
