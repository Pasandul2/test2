const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const matchingService = require('../services/matchingService');

// @route   GET /api/opportunities/student
// @desc    Get opportunity alerts for a student
// @access  Private (Student only)
router.get('/student', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 10, offset = 0, filter = 'all' } = req.query;

    // Verify user is a student
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Student role required'
      });
    }

    let whereClause = 'WHERE oa.student_id = ?';
    let queryParams = [userId];

    if (filter === 'unviewed') {
      whereClause += ' AND oa.is_viewed = FALSE';
    } else if (filter === 'high_match') {
      whereClause += ' AND oa.match_score >= 70';
    }

    const query = `
      SELECT 
        oa.*,
        jp.title as job_title,
        jp.description,
        jp.location,
        jp.employment_type,
        jp.salary_min,
        jp.salary_max,
        jp.application_deadline,
        e.company_name,
        e.industry,
        u.location as company_location
      FROM opportunity_alerts oa
      JOIN job_postings jp ON oa.job_id = jp.id
      JOIN employers e ON jp.employer_id = e.user_id
      JOIN users u ON e.user_id = u.id
      ${whereClause}
      AND jp.status = 'active'
      ORDER BY oa.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const [alerts] = await pool.execute(query, queryParams);

    // Mark alerts as viewed if requested
    if (req.query.mark_viewed === 'true') {
      await pool.execute(
        'UPDATE opportunity_alerts SET is_viewed = TRUE, viewed_at = NOW() WHERE student_id = ? AND is_viewed = FALSE',
        [userId]
      );
    }

    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        filter_applied: filter
      }
    });

  } catch (error) {
    console.error('Get student opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/opportunities/generate
// @desc    Generate new opportunity alerts based on student preferences
// @access  Private (Student only)
router.post('/generate', auth, async (req, res) => {
  try {
    const { userId } = req.user;

    // Verify user is a student
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Student role required'
      });
    }

    // Use matching service to find opportunities
    const opportunities = await matchingService.findOpportunitiesForStudent(userId);

    // Create opportunity alerts for new matches
    const alertsCreated = [];
    for (const opportunity of opportunities) {
      // Check if alert already exists
      const [existing] = await pool.execute(
        'SELECT id FROM opportunity_alerts WHERE student_id = ? AND job_id = ?',
        [userId, opportunity.job_id]
      );

      if (existing.length === 0) {
        // Create new alert
        const [result] = await pool.execute(`
          INSERT INTO opportunity_alerts (
            student_id, job_id, match_score, alert_type
          ) VALUES (?, ?, ?, 'new_match')
        `, [
          userId,
          opportunity.job_id,
          opportunity.compatibility_score
        ]);

        alertsCreated.push({
          alert_id: result.insertId,
          job_id: opportunity.job_id,
          job_title: opportunity.job_title,
          match_score: opportunity.compatibility_score
        });
      }
    }

    res.json({
      success: true,
      message: `Generated ${alertsCreated.length} new opportunity alerts`,
      data: {
        new_alerts: alertsCreated,
        total_opportunities: opportunities.length
      }
    });

  } catch (error) {
    console.error('Generate opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/opportunities/:alertId/dismiss
// @desc    Dismiss an opportunity alert
// @access  Private (Student only)
router.put('/:alertId/dismiss', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.user;

    // Verify user is a student and owns this alert
    const [alerts] = await pool.execute(
      'SELECT id FROM opportunity_alerts WHERE id = ? AND student_id = ?',
      [alertId, userId]
    );

    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found or access denied'
      });
    }

    await pool.execute(
      'UPDATE opportunity_alerts SET is_dismissed = TRUE WHERE id = ?',
      [alertId]
    );

    res.json({
      success: true,
      message: 'Alert dismissed successfully'
    });

  } catch (error) {
    console.error('Dismiss alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/opportunities/:jobId/apply
// @desc    Apply to a job opportunity
// @access  Private (Student only)
router.post('/:jobId/apply', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.user;
    const { coverLetter = '', resumeUrl = '' } = req.body;

    // Verify user is a student
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Student role required'
      });
    }

    // Check if job exists and is active
    const [jobs] = await pool.execute(
      'SELECT id, employer_id FROM job_postings WHERE id = ? AND status = "active"',
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer active'
      });
    }

    // Check if already applied
    const [existing] = await pool.execute(
      'SELECT id FROM job_applications WHERE job_id = ? AND student_id = ?',
      [jobId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    // Create job application
    const [result] = await pool.execute(`
      INSERT INTO job_applications (
        job_id, student_id, cover_letter, resume_url
      ) VALUES (?, ?, ?, ?)
    `, [jobId, userId, coverLetter, resumeUrl]);

    // Update opportunity alert to mark as viewed
    await pool.execute(
      'UPDATE opportunity_alerts SET is_viewed = TRUE, viewed_at = NOW() WHERE student_id = ? AND job_id = ?',
      [userId, jobId]
    );

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application_id: result.insertId,
        job_id: jobId
      }
    });

  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/opportunities/employer/applications
// @desc    Get applications for employer's jobs
// @access  Private (Employer only)
router.get('/employer/applications', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { jobId, status = 'all', limit = 20 } = req.query;

    // Verify user is an employer
    if (req.user.userType !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Employer role required'
      });
    }

    let whereClause = 'WHERE jp.employer_id = ?';
    let queryParams = [userId];

    if (jobId) {
      whereClause += ' AND jp.id = ?';
      queryParams.push(jobId);
    }

    if (status !== 'all') {
      whereClause += ' AND ja.application_status = ?';
      queryParams.push(status);
    }

    const query = `
      SELECT 
        ja.*,
        jp.title as job_title,
        s.full_name as student_name,
        s.university,
        s.field_of_study,
        s.study_level,
        u.email as student_email,
        esm.compatibility_score,
        esm.score_breakdown
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_id = jp.id
      JOIN students s ON ja.student_id = s.user_id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN employer_student_matches esm ON esm.employer_id = jp.employer_id AND esm.student_id = ja.student_id
      ${whereClause}
      ORDER BY ja.applied_at DESC
      LIMIT ?
    `;

    queryParams.push(parseInt(limit));
    const [applications] = await pool.execute(query, queryParams);

    res.json({
      success: true,
      data: {
        applications,
        total: applications.length
      }
    });

  } catch (error) {
    console.error('Get employer applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/opportunities/employer/applications/:applicationId/status
// @desc    Update application status
// @access  Private (Employer only)
router.put('/employer/applications/:applicationId/status', auth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { userId } = req.user;
    const { status } = req.body;

    const validStatuses = ['applied', 'reviewed', 'interview', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Verify employer owns this job
    const [applications] = await pool.execute(`
      SELECT ja.id, ja.student_id, ja.job_id
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_id = jp.id
      WHERE ja.id = ? AND jp.employer_id = ?
    `, [applicationId, userId]);

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or access denied'
      });
    }

    await pool.execute(
      'UPDATE job_applications SET application_status = ? WHERE id = ?',
      [status, applicationId]
    );

    // If hired, create match success record
    if (status === 'hired') {
      const application = applications[0];
      await pool.execute(`
        INSERT INTO match_successes (
          employer_id, student_id, job_id, match_score, 
          employer_accepted_at, final_status
        ) VALUES (?, ?, ?, ?, NOW(), 'hired')
        ON DUPLICATE KEY UPDATE 
          final_status = 'hired',
          employer_accepted_at = NOW()
      `, [userId, application.student_id, application.job_id, 90]);
    }

    res.json({
      success: true,
      message: 'Application status updated successfully'
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
