const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdminRole } = require('../middleware/auth');
const organizationalChartController = require('../controllers/organizationalChartController');

router.get('/', organizationalChartController.getOrganizationalChart);
router.put('/', authMiddleware, requireAdminRole, organizationalChartController.updateOrganizationalChart);

module.exports = router;

