const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/rbacMiddleware');

router.use(verifyToken);

// CSV Export (Must be placed before /:id)
router.get('/export/csv', incidentController.exportCsv);

// Create new incident (Any authenticated role: employee, analyst, admin)
router.post('/', incidentController.createIncident);

// List incidents (Filtered, Paginated, Sorted)
router.get('/', incidentController.getIncidents);

// Get single incident by ID with artifacts, comments & timeline
router.get('/:id', incidentController.getIncidentById);

// Update incident status/triage/resolution (Analyst or Admin)
router.patch('/:id', requireRoles('analyst', 'admin'), incidentController.updateIncident);

// Assign incident to analyst (Analyst or Admin)
router.patch('/:id/assign', requireRoles('analyst', 'admin'), incidentController.assignIncident);

// Add investigation comment / internal note (Any authenticated role on allowed case)
router.post('/:id/comments', incidentController.addComment);

// Add technical artifact / observable (Analyst or Admin)
router.post('/:id/artifacts', requireRoles('analyst', 'admin'), incidentController.addArtifact);

// Delete artifact (Analyst or Admin)
router.delete('/:id/artifacts/:artifactId', requireRoles('analyst', 'admin'), incidentController.deleteArtifact);

// Delete entire incident (Admin only)
router.delete('/:id', requireRoles('admin'), incidentController.deleteIncident);

// Generate DRAFT IR Report (CyberShield IR Agent JSON schema)
router.get('/:id/draft-report', incidentController.generateDraftReport);

module.exports = router;
