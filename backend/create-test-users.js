const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
  try {
    console.log('🚀 Creating Test Users');
    console.log('=====================');

    // Test users data
    const testUsers = [
      {
        email: 'admin@example.com',
        password: 'admin123',
        userType: 'admin'
      },
      {
        email: 'student@example.com',
        password: 'student123',
        userType: 'student',
        profile: {
          fullName: 'Test Student',
          university: 'Test University',
          studyLevel: 'undergraduate',
          fieldOfStudy: 'Computer Science'
        }
      },
      {
        email: 'employer@example.com',
        password: 'employer123',
        userType: 'employer',
        profile: {
          companyName: 'Test Company',
          companySize: 'medium',
          industry: 'Technology'
        }
      }
    ];

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const [existingUser] = await pool.execute(
          'SELECT id FROM users WHERE email = ?',
          [userData.email]
        );

        if (existingUser.length > 0) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
          // Create user
          const [userResult] = await connection.execute(
            'INSERT INTO users (email, password, user_type) VALUES (?, ?, ?)',
            [userData.email, hashedPassword, userData.userType]
          );

          const userId = userResult.insertId;

          // Create profile based on user type
          if (userData.userType === 'student' && userData.profile) {
            await connection.execute(`
              INSERT INTO students (
                user_id, full_name, university, study_level, field_of_study
              ) VALUES (?, ?, ?, ?, ?)
            `, [
              userId,
              userData.profile.fullName,
              userData.profile.university,
              userData.profile.studyLevel,
              userData.profile.fieldOfStudy
            ]);
          } else if (userData.userType === 'employer' && userData.profile) {
            await connection.execute(`
              INSERT INTO employers (
                user_id, company_name, company_size, industry
              ) VALUES (?, ?, ?, ?)
            `, [
              userId,
              userData.profile.companyName,
              userData.profile.companySize,
              userData.profile.industry
            ]);
          }

          await connection.commit();
          console.log(`✅ Created ${userData.userType}: ${userData.email}`);
          console.log(`   Password: ${userData.password}`);

        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }

      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n🎉 Test users creation completed!');
    console.log('\n📝 You can now test login with these credentials:');
    testUsers.forEach(user => {
      console.log(`   ${user.userType}: ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.log('💡 Make sure MySQL is running and database exists!');
  } finally {
    process.exit();
  }
}

createTestUsers();