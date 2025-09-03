const pool = require('./config/database');

async function runMigration() {
  try {
    console.log('Step 1: Adding employer columns...');
    
    // Add employer profile enhancement columns
    await pool.query(`
      ALTER TABLE employers 
      ADD COLUMN IF NOT EXISTS growth_trajectory ENUM('startup', 'high_growth', 'stable', 'expanding', 'mature') DEFAULT 'stable'
    `);
    
    await pool.query(`
      ALTER TABLE employers 
      ADD COLUMN IF NOT EXISTS work_culture ENUM('collaborative', 'innovative', 'results_driven', 'flexible', 'traditional', 'fast_paced') DEFAULT 'collaborative'
    `);
    
    await pool.query(`ALTER TABLE employers ADD COLUMN IF NOT EXISTS benefits JSON`);
    await pool.query(`ALTER TABLE employers ADD COLUMN IF NOT EXISTS typical_job_types JSON`);
    await pool.query(`ALTER TABLE employers ADD COLUMN IF NOT EXISTS preferred_skills JSON`);
    await pool.query(`ALTER TABLE employers ADD COLUMN IF NOT EXISTS experience_levels JSON`);
    
    console.log('✅ Employer columns added');

    console.log('Step 2: Creating job_applications table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id INT NOT NULL,
        student_id INT NOT NULL,
        application_status ENUM('applied', 'reviewed', 'interview', 'rejected', 'hired') DEFAULT 'applied',
        cover_letter TEXT,
        resume_url VARCHAR(255),
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_application (job_id, student_id),
        INDEX idx_job_applications (job_id, application_status),
        INDEX idx_student_applications (student_id, application_status)
      )
    `);
    
    console.log('✅ job_applications table created');

    console.log('Step 3: Creating opportunity_alerts table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunity_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        job_id INT NOT NULL,
        match_score INT NOT NULL,
        alert_type ENUM('new_match', 'score_update', 'deadline_reminder') DEFAULT 'new_match',
        is_viewed BOOLEAN DEFAULT FALSE,
        is_dismissed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        viewed_at TIMESTAMP NULL,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
        INDEX idx_student_alerts (student_id, is_viewed, created_at DESC),
        INDEX idx_job_alerts (job_id, match_score DESC)
      )
    `);
    
    console.log('✅ opportunity_alerts table created');

    console.log('Step 4: Creating match_successes table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_successes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employer_id INT NOT NULL,
        student_id INT NOT NULL,
        job_id INT NOT NULL,
        match_score INT NOT NULL,
        employer_accepted_at TIMESTAMP NULL,
        student_accepted_at TIMESTAMP NULL,
        interview_scheduled_at TIMESTAMP NULL,
        final_status ENUM('pending', 'interviewed', 'hired', 'not_selected', 'declined') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
        UNIQUE KEY unique_match (employer_id, student_id, job_id),
        INDEX idx_success_tracking (employer_id, final_status),
        INDEX idx_student_success (student_id, final_status)
      )
    `);
    
    console.log('✅ match_successes table created');

    console.log('Migration completed successfully!');
    process.exit(0);
    
  } catch(err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
