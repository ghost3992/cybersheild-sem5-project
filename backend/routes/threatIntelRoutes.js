const express = require('express');
const router = express.Router();
const threatIntelController = require('../controllers/threatIntelController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/rbacMiddleware');

router.use(verifyToken);

// 1. Get Live CISA KEV Exploited Attacks Feed
router.get('/cisa-feed', threatIntelController.getLiveCisaFeed);

// 2. Ingest Live Attack as Internal Incident (Analyst/Admin)
router.post('/ingest', requireRoles('analyst', 'admin'), threatIntelController.ingestLiveAttack);

// 3. AI Threat & MITRE Auto-Analyzer
router.post('/ai-analyze', threatIntelController.analyzeWithAI);

module.exports = router;

