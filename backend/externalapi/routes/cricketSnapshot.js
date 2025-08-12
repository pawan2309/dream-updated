const express = require('express');
const router = express.Router();
const { getDetailedScorecardSnapshot } = require('../services/scorecardService');
const { getOddsSnapshot } = require('../services/oddsService');

// GET /externalapi/cricket/scorecard/:eventId
router.get('/externalapi/cricket/scorecard/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const data = await getDetailedScorecardSnapshot(eventId);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch snapshot', message: error.message });
  }
});

// GET /externalapi/cricket/odds/:eventId
router.get('/externalapi/cricket/odds/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const data = await getOddsSnapshot(eventId);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch snapshot', message: error.message });
  }
});

// GET /externalapi/cricket/:eventId/snapshot
router.get('/externalapi/cricket/:eventId/snapshot', async (req, res) => {
  try {
    const { eventId } = req.params;
    const [scorecard, odds] = await Promise.all([
      getDetailedScorecardSnapshot(eventId),
      getOddsSnapshot(eventId)
    ]);
    res.status(200).json({ scorecard: scorecard || null, odds: odds || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch combined snapshot', message: error.message });
  }
});

module.exports = router;