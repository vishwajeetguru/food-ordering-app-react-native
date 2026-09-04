const { GoogleAuth } = require('./node_modules/google-auth-library');
const https = require('https');

async function enableService(service) {
  const auth = new GoogleAuth({
    keyFile: './service-account.json',
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  const token = accessToken.token || accessToken;

  console.log(`Enabling ${service} for project foody-61bab...`);
  
  const postData = '{}';
  const options = {
    hostname: 'serviceusage.googleapis.com',
    port: 443,
    path: `/v1/projects/foody-61bab/services/${service}:enable`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data.slice(0, 1000)}`);
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else {
          // Check if already enabled
          if (data.includes('already') || res.statusCode === 400) resolve(data);
          else reject(new Error(`Failed to enable ${service}: ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    await enableService('firestore.googleapis.com');
    console.log('✓ Firestore API enabled');
    // Wait a bit for propagation
    console.log('Waiting 10s for propagation...');
    await new Promise(r => setTimeout(r, 10000));
    
    await enableService('identitytoolkit.googleapis.com');
    console.log('✓ Identity Toolkit API enabled (Auth)');
    
    await enableService('firebase.googleapis.com');
    console.log('✓ Firebase API enabled');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
