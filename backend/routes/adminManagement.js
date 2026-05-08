const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdminRole } = require('../middleware/auth');
const adminManagementController = require('../controllers/adminManagementController');

router.use(authMiddleware);
router.use(requireAdminRole);

router.get('/', adminManagementController.getAllUsers);
router.post('/', adminManagementController.createUser);
router.put('/:id', adminManagementController.updateUser);
router.delete('/:id', adminManagementController.deleteUser);

module.exports = router;

