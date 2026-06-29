const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.mp4':  'video/mp4',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  // decode URI, strip query string
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  let filePath = path.join(ROOT, urlPath);

  // SPA fallback — everything that isn't a file gets index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT, 'index.html');
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);

  // Range requests for video seeking
  const range = req.headers.range;
  if (range && mime.startsWith('video/')) {
    const total = stat.size;
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end   = endStr ? parseInt(endStr, 10) : Math.min(start + 1024 * 1024, total - 1);
    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${total}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': end - start + 1,
      'Content-Type':   mime,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type':   mime,
    'Content-Length': stat.size,
    'Cache-Control':  'no-cache',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('  ====================================');
  console.log('   סוד המשפט — תוכנית דיינים צעירים');
  console.log('  ====================================');
  console.log('');
  console.log(`  הלומדה פועלת על: ${url}`);
  console.log('');
  console.log('  הדפדפן נפתח אוטומטית...');
  console.log('  כדי לסגור — סגור חלון זה.');
  console.log('');

  // open browser
  const { exec } = require('child_process');
  exec(`start "" "${url}"`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`  שגיאה: פורט ${PORT} תפוס.`);
    console.error(`  נסה לפתוח ידנית: http://localhost:${PORT}`);
  } else {
    console.error('  שגיאה:', err.message);
  }
});
