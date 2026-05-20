require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const statsRoutes = require('./routes/stats');

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (same-origin, mobile apps, curl)
    if (!origin) return cb(null, true);
    // In dev, allow everything; in production restrict to allowed origins
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '25mb' }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/db', dataRoutes);
app.use('/api/stats', statsRoutes);

// ── Serve built React frontend ────────────────────────────────────────────────
const frontendDist = path.join(__dirname, '../wl-ops-frontend/dist');
const { existsSync } = require('fs');

if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback — send index.html for all non-API routes
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      app: 'Well Land Ops API',
      version: '2.0.0',
      status: 'running',
      note: 'Frontend not built yet. Run: cd wl-ops-frontend && npm run build',
    });
  });
}

// ── 404 / Error handlers ──────────────────────────────────────────────────────
app.use('/api/*', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`\n  Well Land Ops API v2.0.0`);
  console.log(`  → http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`  → Local network: http://[your-ip]:${PORT}`);
  console.log(`  DB: ${process.env.DB_NAME || 'wl_ops'} @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
  console.log(`  ENV: ${process.env.NODE_ENV || 'development'}\n`);
});
