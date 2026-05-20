const express = require('express');
const pool = require('../db/pool');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const tables = ['rentalAgreements', 'issueReports', 'procurement', 'assets', 'vessels'];
    const results = {};

    for (const t of tables) {
      const { rows } = await pool.query('SELECT data FROM app_data WHERE table_name = $1', [t]);
      results[t] = rows[0]?.data ?? [];
    }

    const activeRentals = results.rentalAgreements.filter(r => r.status === 'Active');
    const dailyRevenue = activeRentals.reduce((s, r) => s + (Number(r.dailyRate) || 0), 0);
    const openIssues = results.issueReports.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;
    const criticalPRs = results.procurement.filter(
      p => p.Urgency === 'CRITICAL' && p.Status !== 'Delivered to Site'
    ).length;

    const assetsByStatus = results.assets.reduce((acc, a) => {
      const s = a.Status || a.Readiness || 'Unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const vesselCount = results.vessels.length;
    const activeAssets = results.assets.filter(a =>
      (a.Status || '').toLowerCase().includes('active') ||
      (a.Readiness || '') === 'Green'
    ).length;

    res.json({
      activeRentals: activeRentals.length,
      dailyRevenue,
      openIssues,
      criticalPRs,
      assetsByStatus,
      totalAssets: results.assets.length,
      activeAssets,
      vesselCount,
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Stats calculation failed' });
  }
});

module.exports = router;
