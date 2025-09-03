const http = require('http');

const testLogin = () => {
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'test123',
    userType: 'student'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Body:', data);
      try {
        const response = JSON.parse(data);
        console.log('Parsed Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

console.log('🧪 Testing login endpoint...');
testLogin();
