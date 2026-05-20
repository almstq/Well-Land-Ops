/**
 * AI routes — multi-provider, auto-detected from .env
 *
 * Priority order (first key found wins):
 *   1. GOOGLE_AI_KEY   → Gemini 1.5 Flash  (FREE — aistudio.google.com)
 *   2. GROQ_API_KEY    → Llama 3.3 70B     (FREE — console.groq.com)
 *   3. ANTHROPIC_API_KEY → Claude Opus 4.7 (Paid)
 *
 * Endpoints:
 *   POST /api/ai/analyze-issue   — diagnose an issue, suggest parts & procedure
 *   POST /api/ai/daily-brief     — generate an operational brief for the dashboard
 *   POST /api/ai/asset-health    — health score & maintenance outlook for a machine
 *   GET  /api/ai/status          — returns which provider is active
 */
require('dotenv').config();
const express = require('express');
const store   = require('../db/jsonStore');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// ─────────────────────────────────────────────────────────────────────────────
// Provider detection & unified callAI()
// ─────────────────────────────────────────────────────────────────────────────

function detectProvider() {
  if (process.env.GOOGLE_AI_KEY)      return 'gemini';
  if (process.env.GROQ_API_KEY)       return 'groq';
  if (process.env.ANTHROPIC_API_KEY)  return 'anthropic';
  return null;
}

function providerLabel() {
  const p = detectProvider();
  if (p === 'gemini')    return 'Google Gemini 2.0 Flash (free)';
  if (p === 'groq')      return 'Groq — Llama 3.3 70B (free)';
  if (p === 'anthropic') return 'Anthropic Claude Opus 4.7';
  return null;
}

function noKeyError() {
  const err = new Error(
    'No AI key configured.\n' +
    '  FREE option 1 — Google Gemini: get key at aistudio.google.com → add GOOGLE_AI_KEY=... to .env\n' +
    '  FREE option 2 — Groq:          get key at console.groq.com    → add GROQ_API_KEY=...  to .env\n' +
    'Then restart the server (re-run START.cmd).'
  );
  err.code = 'NO_AI_KEY';
  return err;
}

/** Extract JSON from a model response, tolerating markdown fences. */
function extractJson(text) {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(m ? m[1].trim() : text.trim());
}

// ── Gemini ────────────────────────────────────────────────────────────────────
async function callGemini(prompt, maxTokens = 1500) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: maxTokens,
    },
  });
  const result = await model.generateContent(prompt);
  const text   = result.response.text();
  return JSON.parse(text);
}

// ── Groq ──────────────────────────────────────────────────────────────────────
async function callGroq(prompt, maxTokens = 1500) {
  const Groq   = require('groq-sdk');
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const chat   = await client.chat.completions.create({
    model:           'llama-3.3-70b-versatile',
    messages:        [{ role: 'user', content: prompt }],
    max_tokens:      maxTokens,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(chat.choices[0].message.content);
}

// ── Anthropic ─────────────────────────────────────────────────────────────────
async function callAnthropic(prompt, maxTokens = 1500) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 90_000 });
  const stream    = await client.messages.stream({
    model:      'claude-opus-4-7',
    max_tokens: maxTokens,
    thinking:   { type: 'adaptive' },
    messages:   [{ role: 'user', content: prompt }],
  });
  const msg  = await stream.finalMessage();
  const text = msg.content.find(b => b.type === 'text')?.text || '';
  return extractJson(text);
}

/** Route to the detected provider. Throws if none configured. */
async function callAI(prompt, maxTokens = 1500) {
  const provider = detectProvider();
  if (!provider) throw noKeyError();
  if (provider === 'gemini')    return callGemini(prompt, maxTokens);
  if (provider === 'groq')      return callGroq(prompt, maxTokens);
  if (provider === 'anthropic') return callAnthropic(prompt, maxTokens);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/status  — lightweight ping used by the frontend
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', (_req, res) => {
  const provider = detectProvider();
  res.json({
    enabled:  !!provider,
    provider: provider || null,
    label:    providerLabel() || 'Not configured',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/analyze-issue
// ─────────────────────────────────────────────────────────────────────────────

router.post('/analyze-issue', async (req, res) => {
  try {
    const { issueId } = req.body;
    if (!issueId) return res.status(400).json({ error: 'issueId is required' });

    const issues    = store.getTable('issueReports');
    const assets    = store.getTable('assets');
    const inventory = store.getTable('inventory');
    const suppliers = store.getTable('suppliers');

    const issue = issues.find(x => x.id === issueId);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const asset = assets.find(a => a['Asset ID'] === issue.assetId);

    const assetHistory = issues
      .filter(i => i.assetId === issue.assetId && i.id !== issueId)
      .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt))
      .slice(0, 6);

    const inventorySnippet = inventory.slice(0, 30).map(i => {
      const name  = i.name || i.Name || i['Item Name'] || 'Unknown';
      const pn    = i.partNumber || i['Part Number'] || '';
      const stock = i.quantity   || i.Quantity || i.stock || 0;
      return `  • ${name}${pn ? ` (${pn})` : ''} — stock: ${stock}`;
    }).join('\n');

    const supplierList = suppliers
      .slice(0, 12)
      .map(s => s.name || s.Supplier || s['Supplier Name'] || 'Unknown')
      .join(', ');

    const prompt = `You are an expert heavy-equipment maintenance advisor for Well Land Operations, a construction and marine company in the Maldives. Analyze this maintenance issue and provide a structured repair plan.

ISSUE:
ID: ${issue.id} | Title: ${issue.title} | Category: ${issue.category} | Priority: ${issue.priority}
Description: ${issue.description || 'Not provided'}
Symptoms: ${issue.symptoms || 'Not provided'}
Location: ${issue.location}
Reported: ${issue.reportedAt ? new Date(issue.reportedAt).toLocaleString() : 'Unknown'}

${asset ? `MACHINE:
${asset['Asset ID']} — ${(asset.Brand || '').trim()} ${(asset.Model || '').trim()} (${asset.Type || 'Unknown'})
Status: ${asset.Status || 'Unknown'} | Readiness: ${asset.Readiness || 'Unknown'} | Year: ${asset.Year || 'Unknown'}
Known Issue: ${asset['Known Issue'] || 'None'}` : 'No specific machine — site-level issue.'}

${assetHistory.length > 0 ? `PRIOR ISSUES FOR THIS MACHINE:\n${assetHistory.map(h => `  [${h.status}] ${h.id}: ${h.category} — ${h.title}`).join('\n')}` : ''}

AVAILABLE INVENTORY:\n${inventorySnippet || '  No data'}

APPROVED SUPPLIERS: ${supplierList || 'Not configured'}

Return ONLY a valid JSON object with this exact structure:
{
  "diagnosis": "Root cause in 2-3 sentences",
  "urgencyAssessment": "CRITICAL or HIGH or MEDIUM or LOW",
  "estimatedHours": 4,
  "safetyWarning": "Safety note or empty string",
  "procedure": ["Step 1", "Step 2", "Step 3"],
  "parts": [
    {
      "name": "Part name",
      "partNumber": "OEM code or empty string",
      "qty": 1,
      "unit": "pcs",
      "isOEM": true,
      "reason": "Why needed",
      "estimatedCost": 0,
      "currency": "MVR",
      "inInventory": false,
      "inventoryNote": "Check or note"
    }
  ],
  "preventiveNote": "Preventive maintenance recommendation"
}`;

    const analysis = await callAI(prompt, 2000);
    res.json({ success: true, issueId, analysis, provider: providerLabel() });
  } catch (err) {
    console.error('[ai:analyze-issue]', err.message);
    res.status(err.code === 'NO_AI_KEY' ? 503 : 500).json({ error: err.message, code: err.code });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/daily-brief
// ─────────────────────────────────────────────────────────────────────────────

router.post('/daily-brief', async (req, res) => {
  try {
    const issues      = store.getTable('issueReports');
    const assets      = store.getTable('assets');
    const procurement = store.getTable('procurement');
    const vessels     = store.getTable('vessels');
    const staff       = store.getTable('staff');

    const openIssues     = issues.filter(i => !['Resolved', 'Closed'].includes(i.status));
    const criticalIssues = openIssues.filter(i => i.priority === 'CRITICAL');
    const criticalPRs    = procurement.filter(p =>
      p.Urgency === 'CRITICAL' &&
      !['Delivered to Site', 'Delivered to HQ Inventory'].includes(p.Status)
    );
    const redFleet     = assets.filter(a => a.Readiness === 'Red');
    const amberFleet   = assets.filter(a => a.Readiness === 'Amber');
    const permitAlerts = staff.filter(s => ['Expired', 'Expiring Soon'].includes(s['Work Permit Status']));
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const prompt = `You are the operations intelligence system for Well Land Operations, a heavy-equipment and marine company in the Maldives. Generate a concise, actionable daily operations brief.

DATE: ${today}

FLEET: ${assets.length} total | ${assets.filter(a => a.Readiness === 'Green').length} ready | ${amberFleet.length} watch | ${redFleet.length} critical
ISSUES: ${openIssues.length} open | ${criticalIssues.length} CRITICAL
PROCUREMENT: ${procurement.length} total | ${criticalPRs.length} CRITICAL pending
VESSELS: ${vessels.length} | STAFF: ${staff.length} | PERMIT ALERTS: ${permitAlerts.length}
${criticalIssues.length > 0 ? `\nCRITICAL ISSUES:\n${criticalIssues.slice(0, 4).map(i => `  • ${i.id}: ${i.title} @ ${i.location}`).join('\n')}` : ''}
${redFleet.length > 0 ? `\nRED MACHINES:\n${redFleet.slice(0, 4).map(a => `  • ${a['Asset ID']} ${(a.Brand || '')} ${(a.Model || '')} @ ${a.Site || a['Current Location'] || 'Unknown'}`).join('\n')}` : ''}
${criticalPRs.length > 0 ? `\nCRITICAL PENDING PRs:\n${criticalPRs.slice(0, 3).map(p => `  • ${p['PR Ref']}: ${p['Item / Service Requested']} for ${p['Site / Location'] || 'Unknown'}`).join('\n')}` : ''}

Return ONLY a valid JSON object:
{
  "headline": "One-line status",
  "summary": "2-3 sentence overview",
  "risks": ["Risk 1", "Risk 2"],
  "opportunities": ["Opportunity 1"],
  "immediateActions": ["Action with specific ref", "Action 2"],
  "outlook": "One sentence short-term outlook"
}`;

    const brief = await callAI(prompt, 1000);
    res.json({ success: true, brief, generatedAt: new Date().toISOString(), provider: providerLabel() });
  } catch (err) {
    console.error('[ai:daily-brief]', err.message);
    res.status(err.code === 'NO_AI_KEY' ? 503 : 500).json({ error: err.message, code: err.code });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/asset-health
// ─────────────────────────────────────────────────────────────────────────────

router.post('/asset-health', async (req, res) => {
  try {
    const { assetId } = req.body;
    if (!assetId) return res.status(400).json({ error: 'assetId is required' });

    const assets = store.getTable('assets');
    const asset  = assets.find(a => a['Asset ID'] === assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const issues = store.getTable('issueReports');
    const assetIssues = issues
      .filter(i => i.assetId === assetId)
      .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
    const openCount = assetIssues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;

    const prompt = `Analyze the health and maintenance outlook for this heavy-equipment asset.

ASSET: ${asset['Asset ID']} — ${(asset.Brand || '').trim()} ${(asset.Model || '').trim()}
Type: ${asset.Type || 'Unknown'} | Status: ${asset.Status || 'Unknown'} | Readiness: ${asset.Readiness || 'Unknown'}
Year: ${asset.Year || 'Unknown'} | Known Issue: ${asset['Known Issue'] || 'None'}
Location: ${asset.Site || asset['Current Location'] || 'Unknown'}

ISSUE HISTORY (${assetIssues.length} total, ${openCount} open):
${assetIssues.slice(0, 8).map(i => `  [${i.status}] ${i.id} (${i.category}): ${i.title}`).join('\n') || '  No history'}

Return ONLY a valid JSON object:
{
  "healthScore": 85,
  "healthLabel": "Good",
  "summary": "2-sentence health assessment",
  "maintenanceWindow": "e.g. Within 30 days",
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "riskFactors": ["Risk 1"],
  "nextInspectionDue": "Suggested timeframe"
}`;

    const health = await callAI(prompt, 800);
    res.json({ success: true, assetId, health, provider: providerLabel() });
  } catch (err) {
    console.error('[ai:asset-health]', err.message);
    res.status(err.code === 'NO_AI_KEY' ? 503 : 500).json({ error: err.message, code: err.code });
  }
});

module.exports = router;
