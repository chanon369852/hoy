// ** controllers/emailVerificationController.js **
// Email Verification Controller
const pool = require('../utils/db');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register with email verification
exports.registerWithVerification = async (req, res) => {
  const { name, email, password, client_name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Check if email already exists
    const [existing] = await pool.execute(
      'SELECT id, email, status FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      const user = existing[0];
      // If email exists but not verified, allow resend verification
      if (user.status === 'pending') {
        return res.status(409).json({ 
          message: 'Email already registered but not verified. Please check your email or request a new verification link.',
          canResend: true,
          email: email
        });
      }
      return res.status(409).json({ message: 'Email already exists.' });
    }

    // Create client if client_name provided
    let clientId = null;
    if (client_name && client_name.trim()) {
      const [clientRes] = await pool.execute(
        'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
        [client_name.trim(), email, null]
      );
      clientId = clientRes.insertId;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert user with pending status
    const [userRes] = await pool.execute(
      `INSERT INTO users (client_id, name, email, password_hash, role, status, verification_token, token_expiry) 
       VALUES (?, ?, ?, ?, "viewer", "pending", ?, ?)`,
      [clientId, name || null, email, password_hash, verificationToken, tokenExpiry]
    );

    // TODO: Send verification email here
    // For now, return token in response (should be sent via email in production)
    console.log(`Verification token for ${email}: ${verificationToken}`);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      verificationToken: verificationToken, // Remove in production, send via email instead
      email: email
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const [users] = await pool.execute(
      'SELECT id, email, token_expiry, status FROM users WHERE verification_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Invalid verification token.' });
    }

    const user = users[0];

    // Check if already verified
    if (user.status === 'active') {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    // Check if token expired
    if (new Date(user.token_expiry) < new Date()) {
      return res.status(400).json({ message: 'Verification token has expired. Please request a new one.' });
    }

    // Update user status to active
    await pool.execute(
      'UPDATE users SET status = "active", verification_token = NULL, token_expiry = NULL WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const [userData] = await pool.execute(
      'SELECT id, client_id, name, email, role FROM users WHERE id = ?',
      [user.id]
    );

    const userInfo = userData[0];
    const jwtToken = jwt.sign(
      { id: userInfo.id, client_id: userInfo.client_id, role: userInfo.role, email: userInfo.email },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      message: 'Email verified successfully!',
      token: jwtToken,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        role: userInfo.role,
        client_id: userInfo.client_id
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, email, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    const user = users[0];

    if (user.status === 'active') {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.execute(
      'UPDATE users SET verification_token = ?, token_expiry = ? WHERE id = ?',
      [verificationToken, tokenExpiry, user.id]
    );

    // TODO: Send verification email here
    console.log(`New verification token for ${email}: ${verificationToken}`);

    res.json({
      message: 'Verification email sent. Please check your email.',
      verificationToken: verificationToken // Remove in production
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error during resend verification.' });
  }
};


