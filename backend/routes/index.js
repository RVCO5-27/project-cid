const express = require('express');
const router = express.Router();

// Routes
router.use('/carousel', require('./carousel'));
router.use('/organizational-chart', require('./organizationalChart'));
router.use('/schools', require('./schools'));
router.use('/issuances', require('./issuances'));
router.use('/stats', require('./stats'));
router.use('/create-admin', require('./createAdmin'));
router.use('/upload', require('./upload'));
router.use('/auth', require('./auth'));
router.use('/admin', require('./admin'));
router.use('/documents', require('./documents'));
router.use('/audit-logs', require('./auditLogs'));

module.exports = router;