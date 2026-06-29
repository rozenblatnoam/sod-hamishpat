import archiver from 'archiver';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const outputDir = join(__dirname, 'scorm-package');

if (!existsSync(outputDir)) mkdirSync(outputDir);

const outputPath = join(outputDir, 'escape-room-scorm.zip');
const output = createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✅ SCORM package created: scorm-package/escape-room-scorm.zip`);
  console.log(`   Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n📦 Upload this ZIP to Moodle:`);
  console.log(`   Moodle → Add activity → SCORM package → Upload ZIP`);
  console.log(`   Completion: Mastery score 70% (passed when ≥70% cases solved)`);
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);

// Add the built app files
archive.directory(distDir, false);

await archive.finalize();
