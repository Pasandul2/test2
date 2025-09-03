const express = require('express');
const router = express.Router();
const matchingService = require('../services/matchingService');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/matching/employer/generate
// @desc    Generate bidirectional matches for employer
// @access  Private (Employer only)
router.post('/employer/generate', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { jobId } = req.body;

    // Verify user is an employer
    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Employer role required'
      });
    }

    const matches = await matchingService.performBidirectionalMatching(userId, jobId);

    res.json({
      success: true,
      message: 'Bidirectional matching completed',
      data: matches
    });

  } catch (error) {
    console.error('Employer matching error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate employer matches'
    });
  }
});

// @route   GET /api/matching/employer/:employerId/matches
// @desc    Get stored matches for employer
// @access  Private (Employer/Admin)
router.get('/employer/:employerId/matches', authMiddleware, async (req, res) => {
  try {
    const { employerId } = req.params;
    const { jobId, limit = 20 } = req.query;

    // Verify access
    if (req.user.userId !== parseInt(employerId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const matches = await matchingService.getEmployerMatches(
      employerId, 
      jobId || null, 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: matches
    });

  } catch (error) {
    console.error('Get employer matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employer matches'
    });
  }
});

// @route   POST /api/matching/student/find-opportunities
// @desc    Find job opportunities for student
// @access  Private (Student only)
router.post('/student/find-opportunities', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Student role required'
      });
    }

    const opportunities = await matchingService.findOpportunitiesForStudent(userId);

    res.json({
      success: true,
      message: 'Opportunities found',
      data: opportunities
    });

  } catch (error) {
    console.error('Student opportunity search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to find opportunities'
    });
  }
});

// @route   GET /api/matching/students/:studentId
// @desc    Get job matches for a student
// @access  Private (Student/Admin)
router.get('/students/:studentId', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify access
    if (req.user.userId !== parseInt(studentId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const opportunities = await matchingService.findOpportunitiesForStudent(studentId);

    res.json({
      success: true,
      data: opportunities
    });

  } catch (error) {
    console.error('Student matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student matches'
    });
  }
});

// @route   GET /api/matching/jobs/:jobId
// @desc    Get student matches for a job
// @access  Private (Employer/Admin)
router.get('/jobs/:jobId', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { limit = 20 } = req.query;

    // Get job details to verify employer ownership
    const db = require('../config/database');
    const jobQuery = 'SELECT employer_id FROM job_postings WHERE id = ?';
    const [jobRows] = await db.execute(jobQuery, [jobId]);

    if (jobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const { employer_id } = jobRows[0];

    // Verify access
    if (req.user.userId !== employer_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const matches = await matchingService.getEmployerMatches(
      employer_id, 
      jobId, 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: matches
    });

  } catch (error) {
    console.error('Job matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job matches'
    });
  }
});

// @route   POST /api/matching/feedback
// @desc    Submit feedback on match quality
// @access  Private
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { matchId, rating, feedback, suggestions } = req.body;

    // Store feedback in database
    const db = require('../config/database');
    const query = `
      INSERT INTO user_feedback (user_id, feedback_type, reference_id, rating, feedback_text, suggestions)
      VALUES (?, 'match', ?, ?, ?, ?)
    `;

    await db.execute(query, [userId, matchId, rating, feedback, suggestions]);

    res.json({
      success: true,
      message: 'Match feedback submitted successfully'
    });

  } catch (error) {
    console.error('Match feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit match feedback'
    });
  }
});

// @route   POST /api/matching/contact-student
// @desc    Mark that employer contacted a student
// @access  Private (Employer only)
router.post('/contact-student', authMiddleware, async (req, res) => {
  try {
    const { matchId, message } = req.body;

    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Employer role required'
      });
    }

    // Update match status
    const db = require('../config/database');
    const updateQuery = `
      UPDATE employer_student_matches 
      SET status = 'contacted' 
      WHERE id = ? AND employer_id = ?
    `;

    await db.execute(updateQuery, [matchId, req.user.userId]);

    // Log the contact for tracking
    const logQuery = `
      INSERT INTO user_feedback (user_id, feedback_type, reference_id, feedback_text)
      VALUES (?, 'match', ?, ?)
    `;

    await db.execute(logQuery, [req.user.userId, matchId, `Contacted student: ${message}`]);

    res.json({
      success: true,
      message: 'Student contact recorded'
    });

  } catch (error) {
    console.error('Contact student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record student contact'
    });
  }
});

module.exports = router;
