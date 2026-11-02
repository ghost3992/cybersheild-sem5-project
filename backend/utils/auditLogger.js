const db = require('../config/db');

/**
 * Record an audit log for security & compliance visibility
 */
async function logAuditAction({ req, userId = null, userEmail = null, userRole = null, action, details = null }) {
  try {
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || req?.connection?.remoteAddress || '127.0.0.1';
    const effectiveUserId = userId || req?.user?.id || null;
    const effectiveEmail = userEmail || req?.user?.email || null;
    const effectiveRole = userRole || req?.user?.role || null;

    await db.query(
      `INSERT INTO audit_logs (user_id, user_email, user_role, action, ip_address, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [effectiveUserId, effectiveEmail, effectiveRole, action, String(ipAddress), details ? String(details) : null]
    );
  } catch (err) {
    console.error('[Audit Logger] Failed to write audit entry:', err.message);
  }
}

module.exports = {
  logAuditAction
};

