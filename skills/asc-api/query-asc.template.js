#!/usr/bin/env node
/**
 * ASC Status Query — 9Soccer
 * Usage: node scripts/query-asc.js
 * Requires env: ASC_API_KEY_ID, ASC_API_KEY_ISSUER_ID, ASC_KEY_P8
 *
 * In CI (GitHub Actions): credentials come from secrets automatically.
 * Locally: set the env vars, pointing ASC_KEY_P8 to the active .p8 content.
 */
const https = require('https');
const crypto = require('crypto');

const KEY_ID = process.env.ASC_API_KEY_ID;
const ISSUER_ID = process.env.ASC_API_KEY_ISSUER_ID;
const KEY_P8 = process.env.ASC_KEY_P8;
const APP_ID = '6760544822';

if (!KEY_ID || !ISSUER_ID || !KEY_P8) {
  console.log('ASC credentials not in environment:');
  console.log('  ASC_API_KEY_ID:', KEY_ID ? 'SET' : 'NOT SET');
  console.log('  ASC_API_KEY_ISSUER_ID:', ISSUER_ID ? 'SET' : 'NOT SET');
  console.log('  ASC_KEY_P8:', KEY_P8 ? 'SET' : 'NOT SET');
  console.log('\nThese are GitHub Actions secrets.');
  console.log('Set them locally to run this script, or check CI logs for real data.');
  process.exit(1);
}

function makeToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1'
  })).toString('base64url');
  const data = `${header}.${payload}`;
  // ES256: use ieee-p1363 encoding for raw 64-byte R+S (JWT compatible)
  const sig = crypto.sign(null, Buffer.from(data), { key: KEY_P8, dsaEncoding: 'ieee-p1363' });
  return `${data}.${sig.toString('base64url')}`;
}

function get(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.appstoreconnect.apple.com',
      path: `/v1/${path}`,
      headers: { Authorization: `Bearer ${makeToken()}` }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Querying ASC for app', APP_ID, '...\n');

  const appRes = await get(`apps/${APP_ID}`);
  if (appRes.status !== 200) {
    console.log('Error:', appRes.status, JSON.stringify(appRes.body, null, 2));
    return;
  }
  const attrs = appRes.body.data.attributes;
  console.log('=== APP INFO ===');
  console.log('Name:', attrs.name);
  console.log('Bundle ID:', attrs.bundleId);
  console.log('SKU:', attrs.sku);
  console.log('Primary locale:', attrs.primaryLocale);

  const iapRes = await get(`apps/${APP_ID}/inAppPurchasesV2?limit=20`);
  console.log('\n=== IAP PRODUCTS ===');
  if (iapRes.status !== 200) {
    console.log('Error:', iapRes.status, JSON.stringify(iapRes.body?.errors, null, 2));
  } else {
    const iaps = iapRes.body.data || [];
    console.log(`Found ${iaps.length} products:`);
    iaps.forEach(iap => {
      const a = iap.attributes;
      console.log(`  - ${a.productId} | ${a.name} | ${a.state}`);
    });
  }

  const buildsRes = await get(`apps/${APP_ID}/builds?sort=-uploadedDate&limit=5`);
  console.log('\n=== RECENT BUILDS ===');
  if (buildsRes.status === 200) {
    (buildsRes.body.data || []).forEach(b => {
      const a = b.attributes;
      console.log(`  - v${a.version} (${a.uploadedDate?.split('T')[0]}) processingState=${a.processingState} expired=${a.expired}`);
    });
  }
}

main().catch(console.error);
