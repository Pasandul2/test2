const express = require('express');
const router = express.Router();
const profileAnalysisService = require('../services/profileAnalysis');
const careerPathwayService = require('../services/careerPathwayService');
const matchingService = require('../services/matchingService');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/flow/student/complete-assessment
// @desc    Complete student assessment and trigger full pathway process
// @access  Private (Student only)
router.post('/student/complete-assessment', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Student role required'
      });
    }

    const {
      skills,
      education,
      experience,
      preferences,
      socioeconomic,
      location
    } = req.body;

    // Step 1: Analyze student profile
    console.log('Step 1: Analyzing student profile...');
    const studentData = {
      userId,
      skills,
      education,
      experience,
      preferences,
      socioeconomic,
      location
    };

    const profileAnalysis = await profileAnalysisService.analyzeStudentProfile(studentData);

    // Step 2: Generate career pathways
    console.log('Step 2: Generating career pathways...');
    const pathways = await careerPathwayService.generateCareerPathways(userId);

    // Step 3: Find job opportunities
    console.log('Step 3: Finding job opportunities...');
    const opportunities = await matchingService.findOpportunitiesForStudent(userId);

    // Step 4: Compile complete results
    const completeAssessment = {
      profile_analysis: profileAnalysis,
      career_pathways: pathways,
      job_opportunities: opportunities.slice(0, 10), // Top 10 opportunities
      assessment_summary: {
        completed_at: new Date().toISOString(),
        total_pathways: pathways.pathways?.length || 0,
        total_opportunities: opportunities.length,
        top_compatibility_score: opportunities[0]?.compatibility_score || 0,
        recommended_pathway: pathways.pathways?.[0]?.title || 'Direct Entry Career Path'
      }
    };

    res.json({
      success: true,
      message: 'Complete assessment process finished',
      data: completeAssessment
    });

  } catch (error) {
    console.error('Complete assessment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete assessment process'
    });
  }
});

// @route   POST /api/flow/employer/setup-complete
// @desc    Complete employer setup and generate initial matches
// @access  Private (Employer only)
router.post('/employer/setup-complete', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Employer role required'
      });
    }

    const { jobId, companyData } = req.body;

    // Step 1: Update employer profile if provided
    if (companyData) {
      const db = require('../config/database');
      const updateQuery = `
        UPDATE employers SET 
          industry = ?, 
          company_description = ?, 
          growth_trajectory = ?
        WHERE user_id = ?
      `;
      
      await db.execute(updateQuery, [
        companyData.industry,
        companyData.description,
        companyData.growth_trajectory,
        userId
      ]);
    }

    // Step 2: Generate bidirectional matches
    console.log('Step 2: Generating bidirectional matches...');
    const matches = await matchingService.performBidirectionalMatching(userId, jobId);

    // Step 3: Compile results
    const setupResults = {
      employer_setup: {
        profile_updated: !!companyData,
        job_focused: !!jobId,
        setup_completed_at: new Date().toISOString()
      },
      matching_results: matches,
      next_steps: [
        'Review top candidate matches',
        'Contact promising candidates',
        'Schedule interviews',
        'Provide feedback on match quality'
      ]
    };

    res.json({
      success: true,
      message: 'Employer setup and matching completed',
      data: setupResults
    });

  } catch (error) {
    console.error('Employer setup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete employer setup'
    });
  }
});

// @route   GET /api/flow/student/:studentId/dashboard-data
// @desc    Get comprehensive dashboard data for student
// @access  Private
router.get('/student/:studentId/dashboard-data', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify access
    if (req.user.userId !== parseInt(studentId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all student data in parallel
    const [profileAnalysis, pathways, opportunities] = await Promise.all([
      profileAnalysisService.getProfileAnalysis(studentId).catch(() => null),
      careerPathwayService.getStudentCareerPathways(studentId).catch(() => []),
      matchingService.findOpportunitiesForStudent(studentId).catch(() => [])
    ]);

    const dashboardData = {
      profile_analysis: profileAnalysis,
      career_pathways: pathways,
      job_opportunities: opportunities.slice(0, 10),
      dashboard_stats: {
        pathways_available: pathways.length,
        opportunities_found: opportunities.length,
        profile_completed: !!profileAnalysis,
        avg_compatibility: opportunities.length > 0 
          ? Math.round(opportunities.reduce((sum, opp) => sum + opp.compatibility_score, 0) / opportunities.length)
          : 0
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Student dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
});

// @route   GET /api/flow/employer/:employerId/dashboard-data
// @desc    Get comprehensive dashboard data for employer
// @access  Private
router.get('/employer/:employerId/dashboard-data', authMiddleware, async (req, res) => {
  try {
    const { employerId } = req.params;

    // Verify access
    if (req.user.userId !== parseInt(employerId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get employer matches and job postings
    const db = require('../config/database');
    
    const [matches, jobPostings] = await Promise.all([
      matchingService.getEmployerMatches(employerId, null, 20).catch(() => []),
      db.execute(
        'SELECT * FROM job_postings WHERE employer_id = ? AND status = "active" ORDER BY created_at DESC',
        [employerId]
      ).then(([rows]) => rows).catch(() => [])
    ]);

    const dashboardData = {
      matches: matches,
      job_postings: jobPostings,
      dashboard_stats: {
        total_matches: matches.length,
        active_jobs: jobPostings.length,
        avg_compatibility: matches.length > 0
          ? Math.round(matches.reduce((sum, match) => sum + match.compatibility_score, 0) / matches.length)
          : 0,
        contacted_candidates: matches.filter(m => m.status === 'contacted').length
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Employer dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
});

// @route   POST /api/flow/reinforce-learning
// @desc    Update system based on user feedback (reinforcement learning simulation)
// @access  Private
router.post('/reinforce-learning', authMiddleware, async (req, res) => {
  try {
    const { feedbackType, data, outcome } = req.body;
    const { userId } = req.user;

    // Store the feedback for system improvement
    const db = require('../config/database');
    
    const feedbackQuery = `
      INSERT INTO user_feedback (
        user_id, feedback_type, reference_id, feedback_text, 
        rating, suggestions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const feedbackText = JSON.stringify({
      type: feedbackType,
      data: data,
      outcome: outcome
    });

    await db.execute(feedbackQuery, [
      userId,
      'reinforcement',
      data.referenceId || null,
      feedbackText,
      outcome.success ? 5 : 2,
      outcome.improvements || null
    ]);

    // Simple reinforcement learning update (in production, this would be more sophisticated)
    let improvementSuggestions = [];
    
    if (feedbackType === 'pathway_follow') {
      if (outcome.success) {
        improvementSuggestions.push('Pathway recommendations are effective for similar profiles');
      } else {
        improvementSuggestions.push('Adjust pathway feasibility scoring for similar profiles');
      }
    }

    if (feedbackType === 'job_application') {
      if (outcome.success) {
        improvementSuggestions.push('Job matching algorithm performed well');
      } else {
        improvementSuggestions.push('Review job matching criteria and weights');
      }
    }

    res.json({
      success: true,
      message: 'Feedback recorded for system improvement',
      improvements: improvementSuggestions
    });

  } catch (error) {
    console.error('Reinforcement learning error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process feedback'
    });
  }
});

// @route   GET /api/flow/system-stats
// @desc    Get system-wide statistics
// @access  Private (Admin only)
router.get('/system-stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin role required'
      });
    }

    const db = require('../config/database');

    // Get various system statistics
    const queries = [
      'SELECT COUNT(*) as total_students FROM students',
      'SELECT COUNT(*) as total_employers FROM employers', 
      'SELECT COUNT(*) as total_jobs FROM job_postings WHERE status = "active"',
      'SELECT COUNT(*) as total_matches FROM employer_student_matches',
      'SELECT COUNT(*) as total_pathways FROM career_pathways',
      'SELECT AVG(compatibility_score) as avg_compatibility FROM employer_student_matches',
      'SELECT AVG(feasibility_score) as avg_pathway_feasibility FROM career_pathways',
      'SELECT COUNT(*) as feedback_count FROM user_feedback WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)'
    ];

    const results = await Promise.all(
      queries.map(query => db.execute(query).then(([rows]) => rows[0]))
    );

    const systemStats = {
      users: {
        total_students: results[0].total_students,
        total_employers: results[1].total_employers
      },
      content: {
        active_jobs: results[2].total_jobs,
        total_matches: results[3].total_matches,
        total_pathways: results[4].total_pathways
      },
      performance: {
        avg_match_compatibility: Math.round(results[5].avg_compatibility || 0),
        avg_pathway_feasibility: Math.round(results[6].avg_pathway_feasibility || 0),
        recent_feedback_count: results[7].feedback_count
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: systemStats
    });

  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics'
    });
  }
});

module.exports = router;
