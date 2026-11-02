const db = require('../config/db');
const { logAuditAction } = require('../utils/auditLogger');

// Get all users (Admin only)
async function getAllUsers(req, res) {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, department, created_at FROM users ORDER BY id ASC'
    );
    return res.json({
      success: true,
      users
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

// Get only analysts & admins (for assignment dropdown)
async function getAnalysts(req, res) {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role, department FROM users WHERE role IN ('analyst', 'admin') ORDER BY name ASC"
    );
    return res.json({
      success: true,
      analysts: users
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve analysts list.' });
  }
}

// Update user role (Admin only)
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'analyst', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const [user] = await db.query('SELECT name, email, role FROM users WHERE id = ?', [id]);
    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    await logAuditAction({
      req,
      action: 'USER_ROLE_CHANGE',
      details: `Changed role of user ${user[0].email} from ${user[0].role} to ${role}`
    });

    return res.json({
      success: true,
      message: `User role updated to ${role}.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
}

module.exports = {
  getAllUsers,
  getAnalysts,
  updateUserRole
};

