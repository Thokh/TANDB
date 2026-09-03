const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

const USER_AGENTS = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'WhatsApp/2.21.12.21 A',
  'Twitterbot/1.0',
  'TelegramBot (like TwitterBot)',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#064;/g, '@')
    .replace(/&#x2022;/g, '•')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanUsernameInput(input) {
  if (!input) return '';
  let clean = input.trim();
  // Remove URL prefixes if user pasted a link
  clean = clean.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '');
  // Remove query params or trailing slash
  clean = clean.split('?')[0].split('/')[0];
  // Remove leading @
  clean = clean.replace(/^@+/, '');
  return clean.trim();
}

async function checkInstagramAccount(rawUsername) {
  const username = cleanUsernameInput(rawUsername);
  if (!username) {
    return {
      username: rawUsername || '',
      status: 'INVALID',
      error: 'Tên người dùng không hợp lệ',
      checkedAt: new Date().toISOString()
    };
  }

  const profileUrl = `https://www.instagram.com/${encodeURIComponent(username)}/`;
  const ua = getRandomUserAgent();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(profileUrl, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });

    const html = await res.text();
    clearTimeout(timeoutId);

    const descMatch = html.match(/<meta\s+(?:property="og:description"|name="description")\s+content="([^"]+)"/i);
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

    // If description meta tag is present with followers
    if (descMatch && descMatch[1]) {
      const desc = decodeHtmlEntities(descMatch[1]);
      // Pattern: "680M Followers, 649 Following, 4,125 Posts - See Instagram photos..."
      const statsMatch = desc.match(/([0-9.,KMkm\s]+)\s*Followers,\s*([0-9.,KMkm\s]+)\s*Following,\s*([0-9.,KMkm\s]+)\s*Posts/i);

      let followers = '0';
      let following = '0';
      let posts = '0';
      let name = username;

      if (statsMatch) {
        followers = statsMatch[1].trim();
        following = statsMatch[2].trim();
        posts = statsMatch[3].trim();
      }

      if (titleMatch && titleMatch[1]) {
        const decodedTitle = decodeHtmlEntities(titleMatch[1]);
        const nameParts = decodedTitle.split('(@');
        if (nameParts.length > 1) {
          name = nameParts[0].trim();
        } else {
          name = decodedTitle.split('•')[0].trim();
        }
      }

      const avatar = imageMatch && imageMatch[1] ? decodeHtmlEntities(imageMatch[1]) : '';
      const isVerified = html.includes('"is_verified":true') || html.includes('Verified');

      return {
        username,
        status: 'LIVE',
        name: name || username,
        followers,
        following,
        posts,
        avatar,
        isVerified,
        profileUrl,
        checkedAt: new Date().toISOString()
      };
    } else {
      // Profile does not have metadata => Account is DIE, deleted, or suspended
      return {
        username,
        status: 'DIE',
        name: '-',
        followers: '-',
        following: '-',
        posts: '-',
        avatar: '',
        isVerified: false,
        profileUrl,
        checkedAt: new Date().toISOString()
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      username,
      status: 'ERROR',
      error: isTimeout ? 'Hết thời gian chờ (Timeout)' : (err.message || 'Lỗi kết nối'),
      name: '-',
      followers: '-',
      following: '-',
      posts: '-',
      avatar: '',
      profileUrl,
      checkedAt: new Date().toISOString()
    };
  }
}

// Robust Promise.all worker pool with concurrency control
async function runBatchQueue(usernames, concurrency, delayMs, onProgress, isAborted) {
  let index = 0;
  const total = usernames.length;

  async function worker() {
    while (index < total) {
      if (isAborted()) return;
      const currentIndex = index++;
      const targetUsername = usernames[currentIndex];

      if (delayMs > 0 && currentIndex > 0) {
        await new Promise(r => setTimeout(r, delayMs));
      }
      if (isAborted()) return;

      try {
        const result = await checkInstagramAccount(targetUsername);
        if (!isAborted()) {
          onProgress(result, currentIndex + 1, total);
        }
      } catch (err) {
        if (!isAborted()) {
          onProgress({
            username: targetUsername,
            status: 'ERROR',
            error: err.message,
            checkedAt: new Date().toISOString()
          }, currentIndex + 1, total);
        }
      }
    }
  }

  const workers = [];
  const workerCount = Math.min(concurrency, total);
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Single Check API
  if (req.method === 'POST' && pathname === '/api/check-single') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const username = data.username;
        if (!username) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Username is required' }));
          return;
        }

        const result = await checkInstagramAccount(username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Batch Check API (Server-Sent Events)
  if (req.method === 'POST' && pathname === '/api/check-batch') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const list = Array.isArray(data.usernames) ? data.usernames : [];
        const concurrency = Math.min(Math.max(parseInt(data.concurrency) || 2, 1), 10);
        const delayMs = Math.max(parseInt(data.delayMs) || 300, 50);

        if (list.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Danh sách tài khoản trống' }));
          return;
        }

        // Setup SSE response
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive'
        });
        if (typeof res.flushHeaders === 'function') {
          res.flushHeaders();
        }
        res.write(': connected\n\n');

        let aborted = false;
        res.on('close', () => {
          if (!res.writableEnded) {
            aborted = true;
          }
        });

        let stats = { total: list.length, checked: 0, live: 0, die: 0, error: 0 };

        await runBatchQueue(
          list,
          concurrency,
          delayMs,
          (item, currentCount, totalCount) => {
            if (aborted) return;
            stats.checked = currentCount;
            if (item.status === 'LIVE') stats.live++;
            else if (item.status === 'DIE') stats.die++;
            else stats.error++;

            const payload = JSON.stringify({
              type: 'progress',
              item,
              stats
            });
            res.write(`data: ${payload}\n\n`);
          },
          () => aborted
        );

        if (!aborted) {
          res.write(`data: ${JSON.stringify({ type: 'done', stats })}\n\n`);
          res.end();
        }
      } catch (err) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        } else {
          res.end();
        }
      }
    });
    return;
  }

  // Health check API
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  // Get Saved State API
  if (req.method === 'GET' && pathname === '/api/state') {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const content = fs.readFileSync(STATE_FILE, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(content);
        return;
      }
    } catch (e) {
      console.error('Error reading state:', e);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rawInput: '', results: [], autoLoop: false, intervalSeconds: 60 }));
    return;
  }

  // Save State API
  if (req.method === 'POST' && pathname === '/api/state') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const parsed = JSON.parse(body || '{}');
        parsed.savedAt = new Date().toISOString();
        fs.writeFileSync(STATE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, savedAt: parsed.savedAt }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA if not found
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

const os = require('os');

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const address of interfaces[k]) {
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }
  return addresses;
}

server.listen(PORT, () => {
  const localIps = getLocalIpAddresses();
  console.log(`===================================================`);
  console.log(`🚀 InstaCheck Pro is running!`);
  console.log(`💻 May hien tai (Local): http://localhost:${PORT}`);
  if (localIps.length > 0) {
    localIps.forEach(ip => {
      console.log(`👥 Mang noi bo (LAN/Wi-Fi): http://${ip}:${PORT}`);
    });
    console.log(`👉 (Cac may khac trong cung mang co the vao link LAN o tren)`);
  }
  console.log(`===================================================`);
});
