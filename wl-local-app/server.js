require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { existsSync } = require('fs');

const authRoutes  = require('./routes/auth');
const dataRoutes  = require('./routes/data');
const statsRoutes = require('./routes/stats');
const aiRoutes    = require('./routes/ai');

const app = express();

// Allow all origins — this server runs on a local network, not the public internet.
// CORS restrictions here would only block the app's own browser tabs.
app.use(cors({ origin: true, credentials: true }));

// Body parsing
app.use(express.json({ limit: '25mb' }));

// API routes
app.use('/api/auth',  authRoutes);
app.use('/api/db',    dataRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai',    aiRoutes);

// Serve built React frontend
const frontendDist = path.join(__dirname, '../wl-ops-frontend/dist');

if (existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist));
  // SPA fallback
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ app: 'Well Land Ops API', version: '2.0.0', note: 'Run: cd wl-ops-frontend && npm run build' });
  });
}

// 404 for unknown API paths
app.use('/api/*', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  let aiStatus;
  if (process.env.GOOGLE_AI_KEY)      aiStatus = '✓ Google Gemini 2.0 Flash (free)';
  else if (process.env.GROQ_API_KEY)  aiStatus = '✓ Groq — Llama 3.3 70B (free)';
  else if (process.env.ANTHROPIC_API_KEY) aiStatus = '✓ Anthropic Claude Opus 4.7';
  else aiStatus = '✗ No AI key — see .env for FREE options (Gemini / Groq)';

  console.log(`\n  Well Land Ops API v2.0`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → Storage: JSON file (data/db.json + data/users.json)`);
  console.log(`  → Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  → AI: ${aiStatus}\n`);
});
