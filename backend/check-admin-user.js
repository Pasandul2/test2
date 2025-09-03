const pool = require('./config/database');

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking Database Status');
    console.log('===========================');

    // Test database connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    
    // Check if database exists
    const [databases] = await connection.execute('SHOW DATABASES LIKE "smart_pathway_db"');
    if (databases.length === 0) {
      console.log('❌ Database "smart_pathway_db" does not exist');
      console.log('💡 Create it with: CREATE DATABASE smart_pathway_db;');
      connection.release();
      return;
    }
    console.log('✅ Database "smart_pathway_db" exists');

    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Check users
    try {
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Users table has ${users[0].count} records`);
      
      if (users[0].count > 0) {
        const [userList] = await connection.execute(
          'SELECT email, user_type FROM users ORDER BY created_at DESC LIMIT 5'
        );
        console.log('📋 Recent users:');
        userList.forEach(user => {
          console.log(`   - ${user.email} (${user.user_type})`);
        });
      }
    } catch (error) {
      console.log('⚠️  Users table might not exist or be empty');
    }

    connection.release();

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure MySQL is running (XAMPP)');
    console.log('   2. Check if database exists: smart_pathway_db');
    console.log('   3. Run: node migrations/createTables.js');
  } finally {
    process.exit();
  }
}

checkDatabaseStatus();