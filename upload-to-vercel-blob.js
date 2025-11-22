import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_y91QxhMQe28jMWU9_vPrP0m1K3ijo6UujiOdYz0fJxFuXbJ';

if (!BLOB_READ_WRITE_TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is required');
  console.error('Get your token from: https://vercel.com/dashboard/stores');
  process.exit(1);
}

const resourcesDir = path.join(__dirname, 'resources');
const uploadedUrlsPath = path.join(__dirname, 'uploaded-urls.json');

async function uploadResources() {
  const files = fs.readdirSync(resourcesDir);
  const uploadedUrls = {};

  console.log(`Found ${files.length} files to upload...\n`);

  for (const file of files) {
    const filePath = path.join(resourcesDir, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      console.log(`Uploading ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

      try {
        const fileBuffer = fs.readFileSync(filePath);
        const blob = await put(file, fileBuffer, {
          access: 'public',
          token: BLOB_READ_WRITE_TOKEN,
          allowOverwrite: true,
        });

        uploadedUrls[file] = blob.url;
        console.log(`✓ Uploaded: ${blob.url}\n`);
      } catch (error) {
        console.error(`✗ Failed to upload ${file}:`, error.message);
        process.exit(1);
      }
    }
  }

  // Save URLs to a JSON file
  fs.writeFileSync(uploadedUrlsPath, JSON.stringify(uploadedUrls, null, 2));
  console.log(`\n✓ All files uploaded successfully!`);
  console.log(`URLs saved to: ${uploadedUrlsPath}`);

  // Print next steps
  console.log('\n📋 Next steps:');
  console.log('1. Update src/Experience/sources.js to use these URLs');
  console.log('2. Add /resources to .gitignore (optional, to keep repo size small)');
  console.log(`3. Copy the URLs from ${path.basename(uploadedUrlsPath)}\n`);
}

uploadResources().catch(console.error);
