import archiver from 'archiver';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const outputDir = join(__dirname, 'standalone-package');

if (!existsSync(outputDir)) mkdirSync(outputDir);

const outputPath = join(outputDir, 'sod-hamishpat.zip');
const output = createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const mb = (archive.pointer() / 1024 / 1024).toFixed(1);
  console.log(`\n✅ ZIP נוצר: standalone-package/sod-hamishpat.zip`);
  console.log(`   גודל: ${mb} MB`);
  console.log(`\n📂 שימוש:`);
  console.log(`   1. חלץ את ה-ZIP לתיקייה`);
  console.log(`   2. פתח את index.html בדפדפן`);
  console.log(`   (Chrome / Edge מומלץ)`);
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);
// app files
archive.directory(distDir, false);
// server + launcher
archive.file(join(__dirname, 'server.js'), { name: 'server.js' });
archive.file(join(__dirname, 'start.bat'), { name: 'start.bat' });
await archive.finalize();
