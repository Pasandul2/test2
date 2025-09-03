-- Migration to add new employer profile fields for bidirectional matching

-- Add new columns to employers table
ALTER TABLE employers 
ADD COLUMN IF NOT EXISTS growth_trajectory ENUM('startup', 'high_growth', 'stable', 'expanding', 'mature') DEFAULT 'stable',
ADD COLUMN IF NOT EXISTS work_culture ENUM('collaborative', 'innovative', 'results_driven', 'flexible', 'traditional', 'fast_paced') DEFAULT 'collaborative',
ADD COLUMN IF NOT EXISTS benefits JSON,
ADD COLUMN IF NOT EXISTS typical_job_types JSON,
ADD COLUMN IF NOT EXISTS preferred_skills JSON,
ADD COLUMN IF NOT EXISTS experience_levels JSON;

-- Create table for job application tracking (part of bidirectional matching)
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
);

-- Create table for opportunity alerts (student receives alerts about matching jobs)
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
);

-- Create table for match success tracking (when both parties accept)
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
);

-- Create view for bidirectional matching dashboard
CREATE OR REPLACE VIEW bidirectional_matching_stats AS
SELECT 
    'employer' as user_type,
    e.user_id,
    u.email,
    e.company_name as name,
    COUNT(DISTINCT esm.id) as total_matches,
    COUNT(DISTINCT CASE WHEN esm.status = 'contacted' THEN esm.id END) as contacted_matches,
    COUNT(DISTINCT jp.id) as active_jobs,
    COUNT(DISTINCT oa.id) as alerts_sent,
    COUNT(DISTINCT ms.id) as successful_matches
FROM employers e
JOIN users u ON e.user_id = u.id
LEFT JOIN employer_student_matches esm ON e.user_id = esm.employer_id
LEFT JOIN job_postings jp ON e.user_id = jp.employer_id AND jp.status = 'active'
LEFT JOIN opportunity_alerts oa ON jp.id = oa.job_id
LEFT JOIN match_successes ms ON e.user_id = ms.employer_id
GROUP BY e.user_id

UNION ALL

SELECT 
    'student' as user_type,
    s.user_id,
    u.email,
    s.full_name as name,
    COUNT(DISTINCT esm.id) as total_matches,
    COUNT(DISTINCT CASE WHEN esm.status = 'contacted' THEN esm.id END) as contacted_matches,
    COUNT(DISTINCT ja.id) as active_jobs,
    COUNT(DISTINCT oa.id) as alerts_sent,
    COUNT(DISTINCT ms.id) as successful_matches
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN employer_student_matches esm ON s.user_id = esm.student_id
LEFT JOIN job_applications ja ON s.user_id = ja.student_id
LEFT JOIN opportunity_alerts oa ON s.user_id = oa.student_id
LEFT JOIN match_successes ms ON s.user_id = ms.student_id
GROUP BY s.user_id;
