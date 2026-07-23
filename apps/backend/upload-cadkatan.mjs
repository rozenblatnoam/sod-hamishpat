// Run: node upload-cadkatan.mjs
// Uploads cadkatan.mp4 (>300MB) to R2 via S3 multipart API
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { createReadStream, statSync } from 'fs';
import { resolve } from 'path';

const ACCOUNT_ID       = '3583ad4a5abcda58b22d8152bcc46751';
const ACCESS_KEY_ID    = '8ce054ffdc90694a8b40be248bf46503';
const SECRET_ACCESS_KEY = '7a38ed394abf2e1dd78108225a62c8da5206008b160c70d8357114ae72294c27';
const BUCKET           = 'sod-hamishpat-videos';
const FILE_PATH        = resolve('../scorm-web/public/videos/cadkatan.mp4');
const KEY              = 'cadkatan.mp4';
const PART_SIZE        = 50 * 1024 * 1024; // 50MB per part

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

async function upload() {
  const fileSize = statSync(FILE_PATH).size;
  console.log(`Uploading ${KEY} (${(fileSize / 1024 / 1024).toFixed(0)} MB)...`);

  const { UploadId } = await s3.send(new CreateMultipartUploadCommand({
    Bucket: BUCKET, Key: KEY, ContentType: 'video/mp4',
  }));

  const parts = [];
  let partNumber = 1;
  let offset = 0;

  while (offset < fileSize) {
    const end = Math.min(offset + PART_SIZE, fileSize);
    const stream = createReadStream(FILE_PATH, { start: offset, end: end - 1 });
    const buf = await streamToBuffer(stream);

    console.log(`  Part ${partNumber}: ${(buf.length / 1024 / 1024).toFixed(0)} MB`);
    const { ETag } = await s3.send(new UploadPartCommand({
      Bucket: BUCKET, Key: KEY, UploadId, PartNumber: partNumber, Body: buf,
    }));
    parts.push({ PartNumber: partNumber, ETag });
    partNumber++;
    offset = end;
  }

  await s3.send(new CompleteMultipartUploadCommand({
    Bucket: BUCKET, Key: KEY, UploadId,
    MultipartUpload: { Parts: parts },
  }));

  console.log('✅ cadkatan.mp4 uploaded successfully!');
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', c => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

upload().catch(e => { console.error('❌', e.message); process.exit(1); });
