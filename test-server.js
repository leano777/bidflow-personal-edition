const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3100;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.url === '/' || req.url === '/index.html') {
    // Serve a simple test page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>BidFlow Test Server</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 2rem; background: #f5f5f5; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .success { color: #22c55e; font-size: 2rem; margin-bottom: 1rem; }
              .info { color: #3b82f6; }
              .accounts { background: #f8fafc; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
              .account { margin: 0.5rem 0; padding: 0.5rem; background: #e2e8f0; border-radius: 4px; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1 class="success">✅ Server is Working!</h1>
              <p>This test server is running successfully on <strong>http://localhost:3100</strong></p>
              
              <h2 class="info">🎯 Next Steps:</h2>
              <p>Since this simple server works, the issue is likely with the Next.js compilation. Let's try these solutions:</p>
              
              <h3>🔧 Quick Fixes to Try:</h3>
              <ol>
                  <li><strong>Clear Next.js cache:</strong> Delete the <code>.next</code> folder</li>
                  <li><strong>Reinstall dependencies:</strong> Delete <code>node_modules</code> and run <code>npm install</code></li>
                  <li><strong>Try different port:</strong> Use port 3001 or 3002</li>
                  <li><strong>Check TypeScript errors:</strong> Look for compilation issues</li>
              </ol>
              
              <h3>🔐 BidFlow Demo Accounts (when working):</h3>
              <div class="accounts">
                  <div class="account">
                      <strong>Estimator:</strong> estimator@company.com / password123 (Full Access)
                  </div>
                  <div class="account">
                      <strong>Project Manager:</strong> pm@company.com / password123 (Management)
                  </div>
                  <div class="account">
                      <strong>Viewer:</strong> viewer@company.com / password123 (Read-only)
                  </div>
              </div>
              
              <h3>🌐 Network Test:</h3>
              <p>Your browser can successfully connect to localhost:3100 ✅</p>
              <p>The issue is with the Next.js application, not network connectivity.</p>
              
              <hr>
              <p><small>🚀 BidFlow Personal Edition Test Server - Port 3100</small></p>
          </div>
      </body>
      </html>
    `);
  } else {
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Page not found</h1><p>This is the test server. Main route is at <a href="/">localhost:3100</a></p>');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Test server running at:`);
  console.log(`   Local:   http://localhost:${port}`);
  console.log(`   Network: http://0.0.0.0:${port}`);
  console.log(`\n✅ If this works in your browser, the issue is with Next.js compilation.`);
  console.log(`📊 Press Ctrl+C to stop this test server`);
});

// Handle errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('🛑 Server stopped');
  server.close();
});

process.on('SIGINT', () => {
  console.log('\n🛑 Server stopped by user');
  server.close();
  process.exit(0);
});
