const pool = require('../config/database');

const createTables = async () => {
  try {
    // Users table (for authentication)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        user_type ENUM('student', 'employer', 'institute', 'admin') NOT NULL,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Students table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        university VARCHAR(255),
        study_level ENUM('undergraduate', 'graduate', 'postgraduate', 'doctorate'),
        field_of_study VARCHAR(255),
        annual_budget ENUM('0-1000', '1000-5000', '5000-10000', '10000+'),
        preferred_location ENUM('remote', 'onsite', 'hybrid', 'flexible'),
        family_obligations BOOLEAN DEFAULT false,
        transportation_limitations TEXT,
        preferred_work_schedule ENUM('full-time', 'part-time', 'flexible', 'weekends'),
        profile_picture VARCHAR(255),
        bio TEXT,
        linkedin_url VARCHAR(255),
        github_url VARCHAR(255),
        portfolio_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Employers table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS employers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        company_size ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
        industry VARCHAR(255),
        location VARCHAR(255),
        website VARCHAR(255),
        description TEXT,
        logo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Skills table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS skills (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) UNIQUE NOT NULL,
        category ENUM('technical', 'soft', 'language', 'certification'),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Student Skills (many-to-many relationship)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS student_skills (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        skill_id INT NOT NULL,
        proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
        years_of_experience DECIMAL(3,1) DEFAULT 0,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_skill (student_id, skill_id)
      )
    `);

    // Job Postings table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS job_postings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employer_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        requirements TEXT,
        location VARCHAR(255),
        employment_type ENUM('full-time', 'part-time', 'contract', 'internship'),
        experience_level ENUM('entry', 'mid', 'senior', 'lead'),
        salary_min DECIMAL(10,2),
        salary_max DECIMAL(10,2),
        remote_allowed BOOLEAN DEFAULT false,
        application_deadline DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE
      )
    `);

    // Job Skills (many-to-many relationship)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS job_skills (
        id INT PRIMARY KEY AUTO_INCREMENT,
        job_id INT NOT NULL,
        skill_id INT NOT NULL,
        required_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
        is_required BOOLEAN DEFAULT true,
        weight DECIMAL(3,2) DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
        UNIQUE KEY unique_job_skill (job_id, skill_id)
      )
    `);

    // Career Pathways table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS career_pathways (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        pathway_name VARCHAR(255) NOT NULL,
        target_role VARCHAR(255),
        current_step INT DEFAULT 1,
        total_steps INT NOT NULL,
        estimated_duration_months INT,
        estimated_cost DECIMAL(10,2),
        difficulty_level ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
        completion_percentage DECIMAL(5,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // Pathway Steps table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pathway_steps (
        id INT PRIMARY KEY AUTO_INCREMENT,
        pathway_id INT NOT NULL,
        step_number INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        step_type ENUM('course', 'project', 'certification', 'experience') NOT NULL,
        resource_url VARCHAR(255),
        estimated_duration_weeks INT,
        cost DECIMAL(10,2) DEFAULT 0.00,
        is_completed BOOLEAN DEFAULT false,
        completion_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pathway_id) REFERENCES career_pathways(id) ON DELETE CASCADE,
        UNIQUE KEY unique_pathway_step (pathway_id, step_number)
      )
    `);

    // Matches table (AI-generated matches between students and jobs)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS matches (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        job_id INT NOT NULL,
        match_score DECIMAL(5,2) NOT NULL,
        skill_match_percentage DECIMAL(5,2),
        location_match BOOLEAN DEFAULT false,
        budget_match BOOLEAN DEFAULT false,
        schedule_match BOOLEAN DEFAULT false,
        ai_reasoning TEXT,
        status ENUM('pending', 'viewed', 'applied', 'rejected', 'hired') DEFAULT 'pending',
        viewed_by_student BOOLEAN DEFAULT false,
        viewed_by_employer BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_job_match (student_id, job_id)
      )
    `);

    // Applications table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        job_id INT NOT NULL,
        cover_letter TEXT,
        resume_url VARCHAR(255),
        application_status ENUM('submitted', 'under_review', 'interview', 'rejected', 'accepted') DEFAULT 'submitted',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_job_application (student_id, job_id)
      )
    `);

    // Skill Assessments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS skill_assessments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        skill_id INT NOT NULL,
        assessment_type ENUM('quiz', 'project', 'peer_review', 'ai_evaluation'),
        score DECIMAL(5,2),
        max_score DECIMAL(5,2) DEFAULT 100.00,
        assessment_data JSON,
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    // Notifications table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type ENUM('match', 'application', 'pathway_update', 'system', 'message'),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Analytics table (for bias monitoring and system performance)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_type VARCHAR(100) NOT NULL,
        user_id INT,
        user_type ENUM('student', 'employer', 'institute', 'admin'),
        event_data JSON,
        demographic_data JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ All database tables created successfully');
    
    // Insert some initial skills
    await insertInitialSkills();
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  }
};

const insertInitialSkills = async () => {
  const skills = [
    // Technical Skills
    { name: 'JavaScript', category: 'technical', description: 'Programming language for web development' },
    { name: 'Python', category: 'technical', description: 'Programming language for backend and data science' },
    { name: 'React', category: 'technical', description: 'Frontend JavaScript library' },
    { name: 'Node.js', category: 'technical', description: 'JavaScript runtime for backend development' },
    { name: 'MySQL', category: 'technical', description: 'Relational database management system' },
    { name: 'Git', category: 'technical', description: 'Version control system' },
    { name: 'HTML/CSS', category: 'technical', description: 'Markup and styling languages for web' },
    { name: 'Java', category: 'technical', description: 'Object-oriented programming language' },
    { name: 'C++', category: 'technical', description: 'System programming language' },
    
    // Soft Skills
    { name: 'Communication', category: 'soft', description: 'Effective verbal and written communication' },
    { name: 'Leadership', category: 'soft', description: 'Ability to lead and motivate teams' },
    { name: 'Problem Solving', category: 'soft', description: 'Analytical thinking and solution finding' },
    { name: 'Teamwork', category: 'soft', description: 'Collaborative work in team environments' },
    { name: 'Time Management', category: 'soft', description: 'Efficient task and schedule management' },
    { name: 'Critical Thinking', category: 'soft', description: 'Objective analysis and evaluation' },
    
    // Certifications
    { name: 'AWS Certified', category: 'certification', description: 'Amazon Web Services certification' },
    { name: 'Google Cloud Certified', category: 'certification', description: 'Google Cloud Platform certification' },
    { name: 'PMP', category: 'certification', description: 'Project Management Professional certification' },
    
    // Languages
    { name: 'English', category: 'language', description: 'English language proficiency' },
    { name: 'Spanish', category: 'language', description: 'Spanish language proficiency' },
    { name: 'French', category: 'language', description: 'French language proficiency' }
  ];

  try {
    for (const skill of skills) {
      await pool.execute(
        'INSERT IGNORE INTO skills (name, category, description) VALUES (?, ?, ?)',
        [skill.name, skill.category, skill.description]
      );
    }
    console.log('✅ Initial skills inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting initial skills:', error.message);
  }
};

// Export the function to be called from migration script
module.exports = createTables;

// If this file is run directly, execute the function
if (require.main === module) {
  createTables().then(() => {
    process.exit(0);
  });
}
