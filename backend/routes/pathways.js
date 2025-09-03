const express = require('express');
const router = express.Router();
const profileAnalysisService = require('../services/profileAnalysis');
const careerPathwayService = require('../services/careerPathwayService');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/pathways/analyze-profile
// @desc    Analyze student profile for pathway generation
// @access  Private
router.post('/analyze-profile', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const studentData = {
      userId,
      ...req.body
    };

    const analysis = await profileAnalysisService.analyzeStudentProfile(studentData);

    res.json({
      success: true,
      message: 'Profile analysis completed',
      data: analysis
    });

  } catch (error) {
    console.error('Profile analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze profile'
    });
  }
});

// @route   GET /api/pathways/analysis/:userId
// @desc    Get stored profile analysis
// @access  Private
router.get('/analysis/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access this analysis
    if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const analysis = await profileAnalysisService.getProfileAnalysis(userId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Profile analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile analysis'
    });
  }
});

// @route   POST /api/pathways/generate
// @desc    Generate career pathways for student
// @access  Private
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    const pathways = await careerPathwayService.generateCareerPathways(userId);

    res.json({
      success: true,
      message: 'Career pathways generated successfully',
      data: pathways
    });

  } catch (error) {
    console.error('Pathway generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate career pathways'
    });
  }
});

// @route   GET /api/pathways/student/:studentId
// @desc    Get stored career pathways for a student
// @access  Private
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Verify user can access these pathways
    if (req.user.userId !== parseInt(studentId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const pathways = await careerPathwayService.getStudentCareerPathways(studentId);

    res.json({
      success: true,
      data: pathways
    });

  } catch (error) {
    console.error('Get pathways error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve career pathways'
    });
  }
});

// @route   POST /api/pathways/feedback
// @desc    Collect user feedback on pathways
// @access  Private
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { pathwayId, rating, feedback, suggestions } = req.body;

    // Store feedback in database
    const db = require('../config/database');
    const query = `
      INSERT INTO user_feedback (user_id, feedback_type, reference_id, rating, feedback_text, suggestions)
      VALUES (?, 'pathway', ?, ?, ?, ?)
    `;

    await db.execute(query, [userId, pathwayId, rating, feedback, suggestions]);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

module.exports = router;
