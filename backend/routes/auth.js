const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('userType').isIn(['student', 'employer', 'institute', 'admin']),
  body('fullName').trim().isLength({ min: 2 }).optional(),
  body('companyName').trim().isLength({ min: 2 }).optional()
], async (req, res) => {
  try {
    // Log the incoming request for debugging
    console.log('🔍 Registration request received:');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, userType, fullName, companyName, ...profileData } = req.body;

    // Check if user already exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password, user_type) VALUES (?, ?, ?)',
        [email, hashedPassword, userType]
      );

      const userId = userResult.insertId;

      // Create profile based on user type
      if (userType === 'student') {
        await connection.execute(`
          INSERT INTO students (
            user_id, full_name, university, study_level, field_of_study,
            annual_budget, preferred_location, family_obligations,
            transportation_limitations, preferred_work_schedule
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          fullName || '',
          profileData.university || '',
          profileData.studyLevel || 'undergraduate',
          profileData.fieldOfStudy || '',
          profileData.annualBudget || '0-1000',
          profileData.preferredLocation || 'flexible',
          profileData.familyObligations === 'yes',
          profileData.transportationLimitations || '',
          profileData.preferredWorkSchedule || 'flexible'
        ]);
      } else if (userType === 'employer') {
        await connection.execute(`
          INSERT INTO employers (
            user_id, company_name, company_size, industry, location, 
            description, growth_trajectory, work_culture, benefits,
            typical_job_types, preferred_skills, experience_levels
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          companyName || profileData.companyName || '',
          profileData.companySize || 'startup',
          profileData.industry || '',
          profileData.location || '',
          profileData.companyDescription || profileData.description || '',
          profileData.growthTrajectory || 'stable',
          profileData.workCulture || 'collaborative',
          JSON.stringify(profileData.benefits || []),
          JSON.stringify(profileData.typicalJobTypes || []),
          JSON.stringify(profileData.preferredSkills || []),
          JSON.stringify(profileData.experienceLevels || [])
        ]);
      }

      await connection.commit();

      // Generate JWT token
      const token = jwt.sign(
        { userId, userType },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: userId,
          email,
          userType
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    // Provide more specific error messages
    let errorMessage = 'Server error during registration';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Database connection failed. Please ensure MySQL is running.';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Database tables not found. Please run database migrations.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = 'Database does not exist. Please create the database first.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        errorCode: error.code,
        errorDetails: error.message 
      })
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  body('userType').isIn(['student', 'employer', 'institute', 'admin'])
], async (req, res) => {
  try {
    // Log the incoming login request for debugging
    console.log('🔍 Login request received:');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Login validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, userType } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, email, password, user_type, is_active FROM users WHERE email = ? AND user_type = ?',
      [email, userType]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type
      }
    });

  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Server error during login';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Database connection failed. Please ensure MySQL is running.';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Database tables not found. Please run database migrations.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = 'Database does not exist. Please create the database first.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        errorCode: error.code,
        errorDetails: error.message 
      })
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, user_type, is_active, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Get profile data based on user type
    let profile = null;
    if (user.user_type === 'student') {
      const [students] = await pool.execute(
        'SELECT * FROM students WHERE user_id = ?',
        [user.id]
      );
      profile = students[0] || null;
    } else if (user.user_type === 'employer') {
      const [employers] = await pool.execute(
        'SELECT * FROM employers WHERE user_id = ?',
        [user.id]
      );
      profile = employers[0] || null;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        isActive: user.is_active,
        createdAt: user.created_at,
        profile
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    // Always return success for security reasons
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

    // TODO: Implement actual email sending logic
    if (users.length > 0) {
      // Generate reset token and send email
      console.log(`Password reset requested for: ${email}`);
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
