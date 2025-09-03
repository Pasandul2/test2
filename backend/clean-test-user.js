const pool = require('./config/database');

async function cleanTestUser() {
  try {
    await pool.execute('DELETE FROM students WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['test@example.com']);
    await pool.execute('DELETE FROM users WHERE email = ?', ['test@example.com']);
    console.log('Test user cleaned');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanTestUser();
