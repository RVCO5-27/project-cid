const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdminRole } = require('../middleware/auth');
const carouselController = require('../controllers/carouselController');

router.get('/', carouselController.getAllCarouselSlides);
router.post('/', authMiddleware, requireAdminRole, carouselController.createCarouselSlide);
router.put('/:id', authMiddleware, requireAdminRole, carouselController.updateCarouselSlide);
router.delete('/:id', authMiddleware, requireAdminRole, carouselController.deleteCarouselSlide);

module.exports = router;

