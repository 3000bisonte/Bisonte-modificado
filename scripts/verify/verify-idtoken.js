#!/usr/bin/env node
/*
 Usage (PowerShell):
   $env:GOOGLE_CLIENT_ID = "<your-web-client-id>"
   $env:ID_TOKEN = "<id-token>"
   node scripts/verify-idtoken.js

 Or:
   node scripts/verify-idtoken.js <id-token>
*/
const { OAuth2Client } = require('google-auth-library');

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const token = process.argv[2] || process.env.ID_TOKEN;
  if (!clientId) {
    console.error('ERROR: Set GOOGLE_CLIENT_ID to your Web Client ID.');
    process.exit(2);
  }
  if (!token) {
    console.log('Usage:');
    console.log('  $env:GOOGLE_CLIENT_ID = "<web-client-id>"');
    console.log('  $env:ID_TOKEN = "<id-token>"');
    console.log('  node scripts/verify-idtoken.js');
    console.log('Or:');
    console.log('  node scripts/verify-idtoken.js <id-token>');
    process.exit(1);
  }
  const client = new OAuth2Client(clientId);
  try {
    const ticket = await client.verifyIdToken({ idToken: token, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('No payload');
    const { sub, email, email_verified, name, iss, aud, exp } = payload;
    console.log('OK: token verified');
    console.log(JSON.stringify({ sub, email, email_verified, name, iss, aud, exp }, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('VERIFY FAILED:', e && (e.message || e));
    process.exit(3);
  }
}

main();
