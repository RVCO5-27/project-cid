const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats');

/**
 * Public endpoint for stats summary
 */
router.get('/summary', statsController.getSummary);

module.exports = router;
