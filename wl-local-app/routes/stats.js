const express = require('express');
const store = require('../db/jsonStore');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/', (req, res) => {
  try {
    const rentalAgreements = store.getTable('rentalAgreements');
    const issueReports     = store.getTable('issueReports');
    const procurement      = store.getTable('procurement');
    const assets           = store.getTable('assets');
    const vessels          = store.getTable('vessels');

    const activeRentals = rentalAgreements.filter(r => r.status === 'Active');
    const dailyRevenue  = activeRentals.reduce((s, r) => s + (Number(r.dailyRate) || 0), 0);
    const openIssues    = issueReports.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;
    const criticalPRs   = procurement.filter(p => p.Urgency === 'CRITICAL' && p.Status !== 'Delivered to Site').length;

    const assetsByStatus = assets.reduce((acc, a) => {
      const s = a.Status || a.Readiness || 'Unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const activeAssets = assets.filter(a =>
      (a.Status || '').toLowerCase().includes('active') || (a.Readiness || '') === 'Green'
    ).length;

    res.json({
      activeRentals: activeRentals.length,
      dailyRevenue,
      openIssues,
      criticalPRs,
      assetsByStatus,
      totalAssets: assets.length,
      activeAssets,
      vesselCount: vessels.length,
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Stats failed' });
  }
});

module.exports = router;
