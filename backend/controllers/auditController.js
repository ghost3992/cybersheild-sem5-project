const db = require('../config/db');

// Get system audit logs (Admin only)
async function getAuditLogs(req, res) {
  try {
    const [logs] = await db.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC'
    );
    return res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit trail.' });
  }
}

module.exports = {
  getAuditLogs
};

