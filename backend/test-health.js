const http = require('http');

const testHealth = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Health check status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Health Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Health check failed: ${e.message}`);
    console.log('💡 Server might not be running on port 5000');
  });

  req.end();
};

console.log('🔍 Testing server health...');
testHealth();
