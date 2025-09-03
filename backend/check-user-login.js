// Check user details and test login
const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function checkUserAndTestLogin() {
  try {
    console.log('🔍 Checking User Details and Testing Login');
    console.log('==========================================');

    // Get user details
    const [users] = await pool.execute(`
      SELECT u.id, u.email, u.password, u.user_type, s.full_name 
      FROM users u 
      LEFT JOIN students s ON u.id = s.user_id 
      ORDER BY u.id DESC
    `);

    console.log('👤 Users found:');
    users.forEach(user => {
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Type: ${user.user_type}`);
      console.log(`   Name: ${user.full_name || 'N/A'}`);
      console.log(`   Password Hash: ${user.password.substring(0, 30)}...`);
      console.log('   ---');
    });

    if (users.length > 0) {
      const user = users[0]; // Most recent user
      
      console.log(`\n🔐 Testing login for: ${user.email}`);
      console.log('💡 Since we cannot reverse the password hash, try logging in with:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: [the password you used during registration]`);
      console.log(`   User Type: ${user.user_type}`);
      
      console.log('\n🧪 Test with the frontend login form:');
      console.log('   URL: http://localhost:3000/login');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkUserAndTestLogin();
