const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/reporting-periods',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Just test if we can hit the endpoint
    console.log('Periods fetch status:', res.statusCode);
  });
});
req.end();
