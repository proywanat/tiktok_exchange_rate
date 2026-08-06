// ─── BOT API Proxy Server ───────────────────────────────────────────────────
// รัน: node server.js
// แล้วเปิด http://localhost:3000 ในเบราว์เซอร์
// ────────────────────────────────────────────────────────────────────────────

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT     = 3000;
const BOT_HOST = 'gateway.api.bot.or.th';
const BOT_PATH = '/Stat-ExchangeRate/v2/DAILY_AVG_EXG_RATE/';

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // ── CORS headers สำหรับทุก response ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  // ── Serve index.html ──
  if (parsed.pathname === '/' || parsed.pathname === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('index.html not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // ── Proxy → BOT API ──
  if (parsed.pathname === '/api/rate') {
    const { start_period, end_period, currency, token } = parsed.query;

    if (!token) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'missing token' })); return;
    }

    const query = new URLSearchParams({ start_period, end_period, currency: currency || 'USD' });
    const botUrl = `https://${BOT_HOST}${BOT_PATH}?${query}`;

    const proxyReq = https.request(botUrl, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'accept': 'application/json'
      }
    }, (proxyRes) => {
      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(body);
      });
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });

    proxyReq.end();
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n✓ Proxy server รันอยู่ที่ http://localhost:${PORT}`);
  console.log(`  เปิด http://localhost:${PORT} ในเบราว์เซอร์ได้เลย\n`);
});
