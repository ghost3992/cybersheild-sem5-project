const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/metrics', analyticsController.getDashboardMetrics);

module.exports = router;

