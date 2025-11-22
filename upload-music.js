import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_y91QxhMQe28jMWU9_vPrP0m1K3ijo6UujiOdYz0fJxFuXbJ';

const musicFile = 'Billie Eilish  - Wildflower  (Epic Orchestral Cover)  __ Great With an Orchestra - Great With an Orchestra.mp3';
const filePath = path.join(__dirname, 'resources', musicFile);

async function uploadMusic() {
  console.log(`Uploading ${musicFile}...`);

  const stats = fs.statSync(filePath);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = await put('background-music.mp3', fileBuffer, {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true
    });

    console.log(`✓ Uploaded successfully!`);
    console.log(`\nURL:\n${blob.url}\n`);

    // Save to file
    fs.writeFileSync('music-url.txt', blob.url);
    console.log('URL also saved to music-url.txt');
  } catch (error) {
    console.error(`✗ Failed to upload:`, error.message);
    process.exit(1);
  }
}

uploadMusic().catch(console.error);
