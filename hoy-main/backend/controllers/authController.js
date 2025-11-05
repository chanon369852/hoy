// ** controllers/authController.js **
const pool = require('../utils/db');
const bcrypt = require('bcrypt'); // ใช้ bcrypt ที่ติดตั้งแล้ว
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');
// Fallback secret for development to avoid crashes if .env is missing
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [rows] = await pool.execute('SELECT id, client_id, name, email, password_hash, role, status FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) return res.status(401).json({ message: 'Invalid credentials (User not found).' });

        // Check if email is verified
        if (user.status === 'pending') {
            return res.status(403).json({ 
                message: 'Please verify your email before logging in.',
                email: user.email,
                canResend: true
            });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({ message: 'Your account is inactive. Please contact administrator.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials (Password mismatch).' });

        const tokenPayload = { id: user.id, client_id: user.client_id, role: user.role, email: user.email };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' }); 

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, client_id: user.client_id } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// สมัครสมาชิกใหม่ แล้วออก token ให้ทันที
exports.register = async (req, res) => {
    const { name, email, password, client_name, role: requestedRole } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // ตรวจว่ามีผู้ใช้งานซ้ำ
        const [existing] = await pool.execute('SELECT id, client_id, name, email, password_hash, role FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            // หากอีเมลมีอยู่แล้ว และรหัสผ่านถูกต้อง ให้ล็อกอินให้เลย (ประสบการณ์ผู้ใช้ที่ดีขึ้น)
            const user = existing[0];
            const ok = await bcrypt.compare(password, user.password_hash || '');
            if (ok) {
                const token = jwt.sign({ id: user.id, client_id: user.client_id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '12h' });
                return res.status(200).json({ token, user: { id: user.id, client_id: user.client_id, role: user.role, email: user.email, name: user.name } });
            }
            return res.status(409).json({ message: 'Email already exists.' });
        }

        // สร้าง client (ถ้ามี client_name) หรือปล่อยให้เป็น NULL
        let clientId = null;
        if (client_name && client_name.trim()) {
            const [clientRes] = await pool.execute(
                'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
                [client_name.trim(), null, null]
            );
            clientId = clientRes.insertId;
        }

        const password_hash = await bcrypt.hash(password, 10);

        // Check if there is an existing superadmin; if none, the next registration becomes superadmin
        const [saRows] = await pool.execute("SELECT COUNT(*) AS cnt FROM users WHERE role = 'superadmin'");
        const isFirstSuperadmin = (saRows && saRows[0] && Number(saRows[0].cnt) === 0);

        // Determine role
        const allowedRoles = isFirstSuperadmin
            ? ['viewer', 'manager', 'admin', 'superadmin']
            : ['viewer', 'manager', 'admin'];
        let role = (requestedRole && allowedRoles.includes(requestedRole)) ? requestedRole : (isFirstSuperadmin ? 'superadmin' : 'admin');

        // If no superadmin exists yet: activate immediately and skip email verification
        if (isFirstSuperadmin) {
            const [userRes] = await pool.execute(
                'INSERT INTO users (client_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, "active")',
                [clientId, name || null, email, password_hash, role]
            );

            const user = { id: userRes.insertId, client_id: clientId, role, email, name: name || null };
            const token = jwt.sign({ id: user.id, client_id: user.client_id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '12h' });

            return res.status(201).json({ 
                success: true,
                message: 'Super Admin bootstrap created and activated.',
                token,
                user
            });
        }

        // Normal users: pending + email verification
        const [userRes] = await pool.execute(
            'INSERT INTO users (client_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, "pending")',
            [clientId, name || null, email, password_hash, role]
        );

        const userId = userRes.insertId;

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await pool.execute(
            'INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, verificationToken, expiresAt]
        );

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${verificationToken}`;
        const emailResult = await sendVerificationEmail(email, verificationUrl);
        
        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Still return success but log the error
        }

        res.status(201).json({ 
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined, // Only show token in development
            verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined // Only show URL in development
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Email verification endpoint
exports.verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const [verifications] = await pool.execute(
            'SELECT user_id, expires_at FROM email_verifications WHERE token = ?',
            [token]
        );

        if (verifications.length === 0) {
            return res.status(400).json({ message: 'Invalid verification token.' });
        }

        const verification = verifications[0];

        // Check if token expired
        if (new Date() > new Date(verification.expires_at)) {
            return res.status(400).json({ message: 'Verification token has expired.' });
        }

        // Update user status to active
        await pool.execute(
            'UPDATE users SET status = ? WHERE id = ?',
            ['active', verification.user_id]
        );

        // Delete used token
        await pool.execute('DELETE FROM email_verifications WHERE token = ?', [token]);

        // Get user data and generate token
        const [users] = await pool.execute(
            'SELECT id, client_id, name, email, role FROM users WHERE id = ?',
            [verification.user_id]
        );

        const user = users[0];
        const authToken = jwt.sign(
            { id: user.id, client_id: user.client_id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            success: true,
            message: 'Email verified successfully!',
            token: authToken,
            user: { id: user.id, client_id: user.client_id, role: user.role, email: user.email, name: user.name }
        });
    } catch (error) {
        console.error('Verify email error:', error);
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
        // Check if user exists and is pending
        const [users] = await pool.execute(
            'SELECT id, status FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = users[0];

        if (user.status === 'active') {
            return res.status(400).json({ message: 'Email already verified.' });
        }

        // Delete old verification tokens
        await pool.execute('DELETE FROM email_verifications WHERE user_id = ?', [user.id]);

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await pool.execute(
            'INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, verificationToken, expiresAt]
        );

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${verificationToken}`;
        const emailResult = await sendVerificationEmail(email, verificationUrl);
        
        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Still return success but log the error
        }

        res.json({
            success: true,
            message: 'Verification email sent successfully.',
            verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined, // Only show token in development
            verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined // Only show URL in development
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};