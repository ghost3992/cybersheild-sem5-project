const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { logAuditAction } = require('../utils/auditLogger');

// Generate JWT Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// User Registration
async function register(req, res) {
  try {
    const { name, email, password, role = 'employee', department = 'IT / General' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Role restrictions: regular registration is only 'employee' or 'analyst' unless authenticated admin creates it
    const validRoles = ['admin', 'analyst', 'employee'];
    const assignedRole = validRoles.includes(role) ? role : 'employee';

    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, department, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, assignedRole, department.trim()]
    );

    const newUserId = result.insertId;

    const user = {
      id: newUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: assignedRole,
      department: department.trim()
    };

    const token = generateToken(user);

    await logAuditAction({
      req,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_REGISTER',
      details: `User registered with role ${user.role} in department ${user.department}`
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user
    });
  } catch (err) {
    console.error('[Auth Controller] Register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while registering user.'
    });
  }
}

// User Login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Lookup user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!users || users.length === 0) {
      await logAuditAction({
        req,
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for non-existent email: ${email}`
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAuditAction({
        req,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN_FAILED',
        details: `Incorrect password entered for ${user.email}`
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };

    const token = generateToken(safeUser);

    await logAuditAction({
      req,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN_SUCCESS',
      details: `User logged in successfully (Role: ${user.role})`
    });

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Controller] Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
}

// Get Current User Profile
async function getProfile(req, res) {
  try {
    const [users] = await db.query('SELECT id, name, email, role, department, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }
    return res.json({
      success: true,
      user: users[0]
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile.'
    });
  }
}

module.exports = {
  register,
  login,
  getProfile
};

