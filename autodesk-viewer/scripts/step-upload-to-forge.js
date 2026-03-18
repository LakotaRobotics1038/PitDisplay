// step-upload-to-forge.js
// Usage: node step-upload-to-forge.js <BUCKET_KEY> <PATH_TO_STEP_FILE>
// Requires: npm install forge-apis

const fs = require('fs/promises');
const path = require('path');
const { AuthClientTwoLegged, ObjectsApi } = require('forge-apis');


// Set your Forge credentials here or use environment variables (APS_CLIENT_ID/APS_CLIENT_SECRET preferred)
const CLIENT_ID = process.env.APS_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.APS_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';

if (process.argv.length < 3) {
  console.error('Usage: node step-upload-to-forge.js <PATH_TO_STEP_FILE>');
  process.exit(1);
}

const BUCKET_KEY = `pitdisplay`;
const STEP_FILE_PATH = process.argv[2];
const FILE_NAME = path.basename(STEP_FILE_PATH);

async function main() {
  // Authenticate
  const authClient = new AuthClientTwoLegged(CLIENT_ID, CLIENT_SECRET, [
    'data:write', 'data:read', 'bucket:read', 'bucket:create'
  ], true);
  await authClient.authenticate();

  // Read file
  const data = await fs.readFile(STEP_FILE_PATH);

  // Upload to bucket using uploadResources
  const objectsApi = new ObjectsApi();
  try {
    const result = await objectsApi.uploadResources(
      BUCKET_KEY,
      [{ objectKey: FILE_NAME, data }],
      {},
      authClient,
      authClient.getCredentials()
    );
    console.log('Upload complete:', result.body);
  } catch (err) {
    console.error('Error uploading file:', err);
    if (err && err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
