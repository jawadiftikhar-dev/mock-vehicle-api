#!/usr/bin/env node
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const jsonServer = require('json-server');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_FILE = path.join(ROOT, 'vehicles.json');
const SSE_INTERVAL_MS = 5000;

// --- Ensure dataset exists ---
if (!fs.existsSync(DATA_FILE)) {
  console.log('vehicles.json not found — generating…');
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'generate-vehicles.js')], { stdio: 'inherit' });
}

// --- json-server router for /vehicles ---
const router = jsonServer.router(DATA_FILE);

// --- SSE clients ---
const sseClients = new Set();
const actionsLog = [];   
const readVehicles = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const jitter = (v, d = 0.01) => +(v + (Math.random() * 2 - 1) * d).toFixed(6);

function emitPositionChange() {
  if (sseClients.size === 0) return;
  let vehicles;
  try { vehicles = readVehicles(); } catch (e) { return console.error(e); }
  const idx = Math.floor(Math.random() * vehicles.length);
  const v = vehicles[idx];
  v.lat = jitter(v.lat);
  v.lng = jitter(v.lng);
  vehicles[idx] = v;
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(vehicles, null, 2) + '\n'); }
  catch (e) { console.error(e); }

  const payload = {
    id: v.id, plate: v.plate, driver: v.driver, status: v.status,
    lat: v.lat, lng: v.lng, timestamp: new Date().toISOString(),
  };
  const line = `event: position\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try { res.write(line); } catch { sseClients.delete(res); }
  }
}
setInterval(emitPositionChange, SSE_INTERVAL_MS);

// --- Static file helper ---
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? '/index.html' : pathname;
  const file = path.join(PUBLIC_DIR, path.normalize(rel));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}

// --- HTTP server ---
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  // SSE
  if (p === '/positions') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 15000);
    req.on('close', () => { clearInterval(hb); sseClients.delete(res); });
    return;
  }

  // Static assets & friendly routes
  if (p === '/' || p === '/explorer' || p === '/about') {
    const map = {
      '/': '/index.html',
      '/explorer': '/explorer.html',
      '/about': '/about.html',
    };
    return serveStatic(req, res, map[p]);
  }
  if (/\.(html|css|js|svg|ico)$/.test(p)) {
    return serveStatic(req, res, p);
  }

    // --- POST /actions : dummy queue-flush target (Task 5) ---
  if (p === '/actions' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 64 * 1024) req.destroy(); });
    req.on('end', () => {
      let payload = null;
      try { payload = JSON.parse(body); } catch {}
      if (!payload || typeof payload !== 'object') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
      const action = { ...payload, receivedAt: new Date().toISOString() };
      actionsLog.push(action);
      if (actionsLog.length > 200) actionsLog.shift();
      console.log('POST /actions →', action);
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, action }));
    });
    return;
  }

  // --- GET /actions : peek at what's been received (handy for review) ---
  if (p === '/actions' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(actionsLog, null, 2));
  }

  // REST via json-server
  router(req, res, () => {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

server.listen(PORT, () => {
  console.log(`Mock vehicle API on http://localhost:${PORT}`);
  console.log(`  GET /            → live dashboard`);
  console.log(`  GET /vehicles`);
  console.log(`  GET /vehicles/:id`);
  console.log(`  GET /positions   (SSE every ${SSE_INTERVAL_MS} ms)`);
});