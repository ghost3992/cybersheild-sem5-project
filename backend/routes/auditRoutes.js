const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/rbacMiddleware');

router.use(verifyToken);
router.get('/', requireRoles('admin'), auditController.getAuditLogs);

module.exports = router;

