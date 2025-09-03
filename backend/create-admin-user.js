const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🔧 Creating Admin User');
    console.log('=====================');

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin';

    // Check if admin already exists
    const [existingAdmin] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND user_type = ?',
      [adminEmail, 'admin']
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists with email:', adminEmail);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, user_type, is_active, email_verified) VALUES (?, ?, ?, ?, ?)',
      [adminEmail, hashedPassword, 'admin', true, true]
    );

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 User ID:', result.insertId);

    console.log('\n🎉 You can now login with:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   User Type: admin`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.log('💡 Make sure MySQL is running and database exists!');
  } finally {
    process.exit();
  }
}

createAdminUser();
