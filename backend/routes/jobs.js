const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all active job postings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      location, 
      employmentType, 
      experienceLevel,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = `
      SELECT jp.*, e.company_name, e.logo_url, e.location as company_location
      FROM job_postings jp
      JOIN employers e ON jp.employer_id = e.id
      WHERE jp.is_active = true
    `;
    const queryParams = [];

    // Add filters
    if (location) {
      query += ' AND (jp.location LIKE ? OR jp.remote_allowed = true)';
      queryParams.push(`%${location}%`);
    }

    if (employmentType) {
      query += ' AND jp.employment_type = ?';
      queryParams.push(employmentType);
    }

    if (experienceLevel) {
      query += ' AND jp.experience_level = ?';
      queryParams.push(experienceLevel);
    }

    if (search) {
      query += ' AND (jp.title LIKE ? OR jp.description LIKE ? OR e.company_name LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY jp.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    const [jobs] = await pool.execute(query, queryParams);

    // Get skills for each job
    for (let job of jobs) {
      const [skills] = await pool.execute(`
        SELECT s.name, s.category, js.required_level, js.is_required
        FROM job_skills js
        JOIN skills s ON js.skill_id = s.id
        WHERE js.job_id = ?
      `, [job.id]);
      job.required_skills = skills;
    }

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: jobs.length
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/jobs/employer/my-jobs
// @desc    Get all jobs posted by the logged-in employer
// @access  Private (Employer)
router.get('/employer/my-jobs', auth, async (req, res) => {
  try {
    console.log('🔍 Fetching jobs for employer:', req.user.userId);
    
    // Get employer ID from user
    const [employers] = await pool.execute(
      'SELECT id FROM employers WHERE user_id = ?',
      [req.user.userId]
    );

    if (employers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only employers can view job postings'
      });
    }

    const employerId = employers[0].id;

    // Get all jobs for this employer with application counts
    const [jobs] = await pool.execute(`
      SELECT 
        jp.*,
        COUNT(ja.id) as applications_count
      FROM job_postings jp
      LEFT JOIN job_applications ja ON jp.id = ja.job_id
      WHERE jp.employer_id = ?
      GROUP BY jp.id
      ORDER BY jp.created_at DESC
    `, [employerId]);

    console.log('✅ Found', jobs.length, 'jobs for employer');

    res.json({
      success: true,
      data: jobs
    });

  } catch (error) {
    console.error('Get employer jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs'
    });
  }
});

// @route   PUT /api/jobs/:id/toggle-status
// @desc    Toggle job active status
// @access  Private (Employer)
router.put('/:id/toggle-status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    console.log('🔍 Toggling job status:', { id, is_active, userId: req.user.userId });

    // Get employer ID
    const [employers] = await pool.execute(
      'SELECT id FROM employers WHERE user_id = ?',
      [req.user.userId]
    );

    if (employers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only employers can manage job postings'
      });
    }

    const employerId = employers[0].id;

    // Verify the job belongs to this employer
    const [jobs] = await pool.execute(
      'SELECT id FROM job_postings WHERE id = ? AND employer_id = ?',
      [id, employerId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not authorized'
      });
    }

    // Update job status
    await pool.execute(
      'UPDATE job_postings SET is_active = ?, updated_at = NOW() WHERE id = ? AND employer_id = ?',
      [is_active, id, employerId]
    );

    console.log('✅ Job status updated successfully');

    res.json({
      success: true,
      message: 'Job status updated successfully'
    });

  } catch (error) {
    console.error('Toggle job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating job status'
    });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job posting
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [jobs] = await pool.execute(`
      SELECT jp.*, e.company_name, e.company_size, e.industry, 
        e.location as company_location, e.website, e.description as company_description,
        e.logo_url
      FROM job_postings jp
      JOIN employers e ON jp.employer_id = e.id
      WHERE jp.id = ? AND jp.is_active = true
    `, [id]);

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const job = jobs[0];

    // Get required skills
    const [skills] = await pool.execute(`
      SELECT s.id, s.name, s.category, s.description, js.required_level, js.is_required, js.weight
      FROM job_skills js
      JOIN skills s ON js.skill_id = s.id
      WHERE js.job_id = ?
      ORDER BY js.is_required DESC, js.weight DESC
    `, [id]);

    job.required_skills = skills;

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/jobs/post
// @desc    Create new job posting for employers
// @access  Private (Employer)
router.post('/post', auth, [
  body('title').trim().isLength({ min: 5 }),
  body('description').trim().isLength({ min: 50 }),
  body('requirements').trim().isLength({ min: 20 }),
  body('location').trim().isLength({ min: 2 }),
  body('employmentType').isIn(['full-time', 'part-time', 'contract', 'internship']),
  body('experienceLevel').isIn(['entry', 'mid', 'senior', 'lead']),
  body('salaryMin').isFloat({ min: 0 }).optional(),
  body('salaryMax').isFloat({ min: 0 }).optional(),
  body('applicationDeadline').isISO8601().optional(),
  body('skills').isArray().optional(),
  body('benefits').isArray().optional()
], async (req, res) => {
  try {
    console.log('🔍 Job posting request received:');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      requirements,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      remoteAllowed,
      applicationDeadline,
      skills = [],
      benefits = [],
      companyOverview
    } = req.body;

    // Get employer ID from user
    const [employers] = await pool.execute(
      'SELECT id FROM employers WHERE user_id = ?',
      [req.user.userId]
    );

    if (employers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only employers can post jobs'
      });
    }

    const employerId = employers[0].id;

    // Insert job posting
    const [result] = await pool.execute(`
      INSERT INTO job_postings (
        employer_id, title, description, requirements, location, 
        employment_type, experience_level, salary_min, salary_max,
        remote_allowed, application_deadline, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
    `, [
      employerId,
      title,
      description,
      requirements,
      location,
      employmentType,
      experienceLevel,
      salaryMin || null,
      salaryMax || null,
      remoteAllowed || false,
      applicationDeadline || null
    ]);

    const jobId = result.insertId;

    // Store skills if provided
    if (skills && skills.length > 0) {
      for (const skill of skills) {
        // Find or create skill
        let [existingSkills] = await pool.execute(
          'SELECT id FROM skills WHERE name = ?',
          [skill]
        );

        let skillId;
        if (existingSkills.length > 0) {
          skillId = existingSkills[0].id;
        } else {
          const [skillResult] = await pool.execute(
            'INSERT INTO skills (name, category, created_at) VALUES (?, ?, NOW())',
            [skill, 'Technical']
          );
          skillId = skillResult.insertId;
        }

        // Link skill to job
        await pool.execute(
          'INSERT INTO job_skills (job_id, skill_id, is_required, required_level, weight) VALUES (?, ?, true, ?, 1)',
          [jobId, skillId, experienceLevel]
        );
      }
    }

    // Store additional metadata in a separate table if needed
    if (benefits.length > 0 || companyOverview) {
      // You could create a job_metadata table or store as JSON in job_postings
      // For now, we'll store in the job description or create a simple metadata approach
    }

    console.log('✅ Job posted successfully with ID:', jobId);

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: {
        jobId,
        title,
        location,
        employmentType
      }
    });

  } catch (error) {
    console.error('Job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while posting job'
    });
  }
});

// @route   POST /api/jobs
// @desc    Create new job posting (legacy endpoint)
// @access  Private (Employer)
router.post('/', auth, [
  body('title').trim().isLength({ min: 5 }),
  body('description').trim().isLength({ min: 50 }),
  body('location').trim().isLength({ min: 2 }),
  body('employmentType').isIn(['full-time', 'part-time', 'contract', 'internship']),
  body('experienceLevel').isIn(['entry', 'mid', 'senior', 'lead']),
  body('salaryMin').isFloat({ min: 0 }).optional(),
  body('salaryMax').isFloat({ min: 0 }).optional(),
  body('applicationDeadline').isISO8601().optional(),
  body('requiredSkills').isArray().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if user is employer
    if (req.user.userType !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only employers can create job postings.'
      });
    }

    // Get employer ID
    const [employers] = await pool.execute(
      'SELECT id FROM employers WHERE user_id = ?',
      [req.user.userId]
    );

    if (employers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      });
    }

    const employerId = employers[0].id;

    const {
      title,
      description,
      requirements,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      remoteAllowed = false,
      applicationDeadline,
      requiredSkills = []
    } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create job posting
      const [jobResult] = await connection.execute(`
        INSERT INTO job_postings (
          employer_id, title, description, requirements, location,
          employment_type, experience_level, salary_min, salary_max,
          remote_allowed, application_deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        employerId, title, description, requirements || '', location,
        employmentType, experienceLevel, salaryMin || null, salaryMax || null,
        remoteAllowed, applicationDeadline || null
      ]);

      const jobId = jobResult.insertId;

      // Add required skills
      for (const skill of requiredSkills) {
        await connection.execute(`
          INSERT INTO job_skills (job_id, skill_id, required_level, is_required, weight)
          VALUES (?, ?, ?, ?, ?)
        `, [
          jobId,
          skill.skillId,
          skill.requiredLevel || 'beginner',
          skill.isRequired !== false,
          skill.weight || 1.0
        ]);
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Job posting created successfully',
        jobId
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update job posting
// @access  Private (Employer - own jobs only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is employer and owns this job
    const [jobs] = await pool.execute(`
      SELECT jp.id, e.user_id
      FROM job_postings jp
      JOIN employers e ON jp.employer_id = e.id
      WHERE jp.id = ?
    `, [id]);

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (jobs[0].user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own job postings.'
      });
    }

    const updateFields = {};
    const allowedFields = [
      'title', 'description', 'requirements', 'location',
      'employment_type', 'experience_level', 'salary_min', 'salary_max',
      'remote_allowed', 'application_deadline', 'is_active'
    ];

    // Map camelCase to snake_case
    const fieldMapping = {
      employmentType: 'employment_type',
      experienceLevel: 'experience_level',
      salaryMin: 'salary_min',
      salaryMax: 'salary_max',
      remoteAllowed: 'remote_allowed',
      applicationDeadline: 'application_deadline',
      isActive: 'is_active'
    };

    Object.keys(req.body).forEach(key => {
      const dbField = fieldMapping[key] || key;
      if (allowedFields.includes(dbField)) {
        updateFields[dbField] = req.body[key];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const setClause = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updateFields);
    values.push(id);

    await pool.execute(
      `UPDATE job_postings SET ${setClause} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Job posting updated successfully'
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete job posting
// @access  Private (Employer - own jobs only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is employer and owns this job
    const [jobs] = await pool.execute(`
      SELECT jp.id, e.user_id
      FROM job_postings jp
      JOIN employers e ON jp.employer_id = e.id
      WHERE jp.id = ?
    `, [id]);

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (jobs[0].user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own job postings.'
      });
    }

    // Soft delete (mark as inactive)
    await pool.execute(
      'UPDATE job_postings SET is_active = false WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Job posting deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/jobs/:id/apply
// @desc    Apply for a job
// @access  Private (Student)
router.post('/:id/apply', auth, [
  body('coverLetter').trim().isLength({ min: 50 }).optional(),
  body('resumeUrl').isURL().optional()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { coverLetter, resumeUrl } = req.body;

    // Check if user is student
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only students can apply for jobs.'
      });
    }

    // Get student ID
    const [students] = await pool.execute(
      'SELECT id FROM students WHERE user_id = ?',
      [req.user.userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const studentId = students[0].id;

    // Check if job exists and is active
    const [jobs] = await pool.execute(
      'SELECT id, application_deadline FROM job_postings WHERE id = ? AND is_active = true',
      [id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer active'
      });
    }

    const job = jobs[0];

    // Check if application deadline has passed
    if (job.application_deadline && new Date() > new Date(job.application_deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    // Check if already applied
    const [existingApplications] = await pool.execute(
      'SELECT id FROM applications WHERE student_id = ? AND job_id = ?',
      [studentId, id]
    );

    if (existingApplications.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create application
    await pool.execute(`
      INSERT INTO applications (student_id, job_id, cover_letter, resume_url)
      VALUES (?, ?, ?, ?)
    `, [studentId, id, coverLetter || '', resumeUrl || '']);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
