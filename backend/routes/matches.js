const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

// @route   POST /api/matches/record-success
// @desc    Record a successful match between employer and student
// @access  Private (Employer or Student)
router.post('/record-success', auth, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { otherPartyId, jobId, matchScore, action } = req.body;

    // Validate input
    if (!otherPartyId || !jobId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: otherPartyId, jobId, action'
      });
    }

    const validActions = ['accept', 'interview', 'hire', 'decline'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    // Determine employer and student IDs
    let employerId, studentId;
    if (userType === 'employer') {
      employerId = userId;
      studentId = otherPartyId;
    } else if (userType === 'student') {
      studentId = userId;
      employerId = otherPartyId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Only employers and students can record matches'
      });
    }

    // Verify the job belongs to the employer
    const [jobs] = await pool.execute(
      'SELECT id FROM job_postings WHERE id = ? AND employer_id = ?',
      [jobId, employerId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or access denied'
      });
    }

    // Check if match record already exists
    const [existingMatches] = await pool.execute(
      'SELECT * FROM match_successes WHERE employer_id = ? AND student_id = ? AND job_id = ?',
      [employerId, studentId, jobId]
    );

    let query, params;
    const now = 'NOW()';
    const scoreToRecord = matchScore || 75; // Default match score

    if (existingMatches.length === 0) {
      // Create new match record
      if (userType === 'employer') {
        query = `
          INSERT INTO match_successes (
            employer_id, student_id, job_id, match_score,
            employer_accepted_at, final_status
          ) VALUES (?, ?, ?, ?, ${now}, ?)
        `;
        params = [employerId, studentId, jobId, scoreToRecord, action === 'accept' ? 'pending' : action];
      } else {
        query = `
          INSERT INTO match_successes (
            employer_id, student_id, job_id, match_score,
            student_accepted_at, final_status
          ) VALUES (?, ?, ?, ?, ${now}, ?)
        `;
        params = [employerId, studentId, jobId, scoreToRecord, action === 'accept' ? 'pending' : action];
      }
    } else {
      // Update existing match record
      if (userType === 'employer') {
        query = `
          UPDATE match_successes SET 
            employer_accepted_at = ${now},
            final_status = ?,
            updated_at = ${now}
          WHERE employer_id = ? AND student_id = ? AND job_id = ?
        `;
        params = [action === 'accept' ? 'pending' : action, employerId, studentId, jobId];
      } else {
        query = `
          UPDATE match_successes SET 
            student_accepted_at = ${now},
            final_status = ?,
            updated_at = ${now}
          WHERE employer_id = ? AND student_id = ? AND job_id = ?
        `;
        params = [action === 'accept' ? 'pending' : action, employerId, studentId, jobId];
      }
    }

    await pool.execute(query, params);

    // If both parties have accepted, update status to interviewed
    if (action === 'accept') {
      const [updatedMatch] = await pool.execute(
        'SELECT * FROM match_successes WHERE employer_id = ? AND student_id = ? AND job_id = ?',
        [employerId, studentId, jobId]
      );

      if (updatedMatch.length > 0) {
        const match = updatedMatch[0];
        if (match.employer_accepted_at && match.student_accepted_at) {
          await pool.execute(
            'UPDATE match_successes SET final_status = "interview_ready" WHERE employer_id = ? AND student_id = ? AND job_id = ?',
            [employerId, studentId, jobId]
          );
        }
      }
    }

    // Update employer_student_matches table
    await pool.execute(
      'UPDATE employer_student_matches SET status = ? WHERE employer_id = ? AND student_id = ?',
      [action === 'accept' ? 'contacted' : 'viewed', employerId, studentId]
    );

    res.json({
      success: true,
      message: 'Match action recorded successfully',
      data: {
        action,
        employer_id: employerId,
        student_id: studentId,
        job_id: jobId
      }
    });

  } catch (error) {
    console.error('Record match success error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/matches/success-stats
// @desc    Get match success statistics
// @access  Private (Employer, Student, Admin)
router.get('/success-stats', auth, async (req, res) => {
  try {
    const { userId, userType } = req.user;

    let whereClause = '';
    let params = [];

    if (userType === 'employer') {
      whereClause = 'WHERE ms.employer_id = ?';
      params = [userId];
    } else if (userType === 'student') {
      whereClause = 'WHERE ms.student_id = ?';
      params = [userId];
    } else if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN final_status = 'pending' THEN 1 END) as pending_matches,
        COUNT(CASE WHEN final_status = 'interview_ready' THEN 1 END) as interview_ready,
        COUNT(CASE WHEN final_status = 'interviewed' THEN 1 END) as interviewed,
        COUNT(CASE WHEN final_status = 'hired' THEN 1 END) as hired,
        COUNT(CASE WHEN final_status = 'declined' THEN 1 END) as declined,
        AVG(match_score) as avg_match_score
      FROM match_successes ms
      ${whereClause}
    `;

    const [stats] = await pool.execute(statsQuery, params);

    // Get recent matches
    const recentQuery = `
      SELECT 
        ms.*,
        jp.title as job_title,
        s.full_name as student_name,
        e.company_name,
        u1.email as employer_email,
        u2.email as student_email
      FROM match_successes ms
      JOIN job_postings jp ON ms.job_id = jp.id
      JOIN students s ON ms.student_id = s.user_id
      JOIN employers e ON ms.employer_id = e.user_id
      JOIN users u1 ON e.user_id = u1.id
      JOIN users u2 ON s.user_id = u2.id
      ${whereClause}
      ORDER BY ms.updated_at DESC
      LIMIT 10
    `;

    const [recentMatches] = await pool.execute(recentQuery, params);

    res.json({
      success: true,
      data: {
        statistics: stats[0],
        recent_matches: recentMatches
      }
    });

  } catch (error) {
    console.error('Get match success stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/matches/bidirectional-dashboard
// @desc    Get comprehensive bidirectional matching dashboard data
// @access  Private (Employer, Student, Admin)
router.get('/bidirectional-dashboard', auth, async (req, res) => {
  try {
    const { userId, userType } = req.user;

    if (!['employer', 'student', 'admin'].includes(userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let dashboardData = {};

    if (userType === 'employer' || userType === 'admin') {
      // Employer dashboard data
      const employerQuery = userType === 'admin' ? 
        'SELECT * FROM bidirectional_matching_stats WHERE user_type = "employer"' :
        'SELECT * FROM bidirectional_matching_stats WHERE user_type = "employer" AND user_id = ?';
      
      const employerParams = userType === 'admin' ? [] : [userId];
      const [employerStats] = await pool.execute(employerQuery, employerParams);

      dashboardData.employer_stats = employerStats;
    }

    if (userType === 'student' || userType === 'admin') {
      // Student dashboard data
      const studentQuery = userType === 'admin' ? 
        'SELECT * FROM bidirectional_matching_stats WHERE user_type = "student"' :
        'SELECT * FROM bidirectional_matching_stats WHERE user_type = "student" AND user_id = ?';
      
      const studentParams = userType === 'admin' ? [] : [userId];
      const [studentStats] = await pool.execute(studentQuery, studentParams);

      dashboardData.student_stats = studentStats;
    }

    // System-wide statistics for admin
    if (userType === 'admin') {
      const [systemStats] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM employer_student_matches) as total_matches_generated,
          (SELECT COUNT(*) FROM opportunity_alerts) as total_alerts_sent,
          (SELECT COUNT(*) FROM job_applications) as total_applications,
          (SELECT COUNT(*) FROM match_successes) as total_successful_matches,
          (SELECT COUNT(*) FROM match_successes WHERE final_status = 'hired') as total_hires,
          (SELECT AVG(compatibility_score) FROM employer_student_matches) as avg_compatibility_score
      `);

      dashboardData.system_stats = systemStats[0];
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get bidirectional dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/matches/schedule-interview
// @desc    Schedule an interview for a successful match
// @access  Private (Employer only)
router.post('/schedule-interview', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { studentId, jobId, interviewDateTime, notes } = req.body;

    // Verify user is an employer
    if (req.user.userType !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Employer role required'
      });
    }

    // Verify match exists and employer owns the job
    const [matches] = await pool.execute(`
      SELECT ms.* FROM match_successes ms
      JOIN job_postings jp ON ms.job_id = jp.id
      WHERE ms.employer_id = ? AND ms.student_id = ? AND ms.job_id = ? AND jp.employer_id = ?
    `, [userId, studentId, jobId, userId]);

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Match not found or access denied'
      });
    }

    // Update match record with interview details
    await pool.execute(`
      UPDATE match_successes SET 
        interview_scheduled_at = ?,
        final_status = 'interviewed',
        updated_at = NOW()
      WHERE employer_id = ? AND student_id = ? AND job_id = ?
    `, [interviewDateTime, userId, studentId, jobId]);

    // Create a notification/alert for the student (if you have a notifications system)
    // This could be implemented later

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      data: {
        employer_id: userId,
        student_id: studentId,
        job_id: jobId,
        interview_datetime: interviewDateTime
      }
    });

  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
