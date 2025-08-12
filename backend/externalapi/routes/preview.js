const express = require('express');
const router = express.Router();
const { getCricketFixturesSnapshot, filterFixturesByPanelSettings } = require('../services/fixturesService');
const { getCasinoResultsSnapshot } = require('../services/casinoService');
const { filterByPanelSettings } = require('../../shared/utils/filterByPanelSettings');

router.post('/externalapi/preview/panel', async (req, res) => {
  try {
    const panelSettings = req.body?.panelSettings || {};

    const [fixtures, casinoResults] = await Promise.all([
      getCricketFixturesSnapshot(),
      getCasinoResultsSnapshot()
    ]);

    const filteredFixtures = fixtures ? filterFixturesByPanelSettings(fixtures, panelSettings) : [];
    const filteredCasino = casinoResults ? filterByPanelSettings(casinoResults, panelSettings) : [];

    res.status(200).json({ fixtures: filteredFixtures, casinoResults: filteredCasino });
  } catch (error) {
    res.status(500).json({ error: 'Failed to build preview', message: error.message });
  }
});

module.exports = router;