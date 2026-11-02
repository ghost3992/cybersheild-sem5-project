const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/rbacMiddleware');

router.use(verifyToken);

// Get list of analysts (analyst & admin can access to populate assignees)
router.get('/analysts', requireRoles('analyst', 'admin'), userController.getAnalysts);

// Admin-only endpoints
router.get('/', requireRoles('admin'), userController.getAllUsers);
router.patch('/:id/role', requireRoles('admin'), userController.updateUserRole);

module.exports = router;

