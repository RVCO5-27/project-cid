const express = require('express');
const router = express.Router();
const issuancesController = require('../controllers/issuances');

/**
 * Public routes for browsing issuances.
 * No authMiddleware required here as this is the public portal view.
 */

// GET /api/issuances - Fetch all public issuances (with optional query filters: q, category_id, series_year)
router.get('/', issuancesController.getPublicIssuances);

// GET /api/issuances/categories - Fetch categories for filtering
router.get('/categories', issuancesController.getCategories);

// GET /api/issuances/years - Fetch unique series years for filtering
router.get('/years', issuancesController.getYears);

// GET /api/issuances/folders - Fetch public folders
router.get('/folders', issuancesController.getPublicFolders);

module.exports = router;

