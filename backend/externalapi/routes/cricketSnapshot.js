const express = require('express');
const router = express.Router();
const { getDetailedScorecardSnapshot } = require('../services/scorecardService');
const { getOddsSnapshot } = require('../services/oddsService');
const { getCricketFixturesSnapshot } = require('../services/fixturesService');
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

// Note: Provider endpoints moved to publicProvider.js for public access

// Direct fetch endpoints - bypass cache and fetch fresh data from external APIs
router.get('/fetch/fixtures', async (req, res) => {
  try {
    const url = 'https://marketsarket.qnsports.live/cricketmatches';
    console.log(`🏏 Direct fetch: Fetching cricket fixtures from ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Betting-ExternalAPI/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Direct fetch: Cricket fixtures fetched successfully`);
    
    res.json({
      success: true,
      message: 'Cricket fixtures fetched directly from external API',
      source: 'direct-fetch',
      url: url,
      timestamp: new Date().toISOString(),
      data: data
    });

  } catch (error) {
    console.error('💥 Direct fetch fixtures error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch fixtures directly', 
      message: error.message,
      source: 'direct-fetch'
    });
  }
});

router.get('/fetch/odds', async (req, res) => {
  try {
    const url = 'https://marketsarket.qnsports.live/odds';
    console.log(`🏏 Direct fetch: Fetching cricket odds from ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Betting-ExternalAPI/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Direct fetch: Cricket odds fetched successfully`);
    
    res.json({
      success: true,
      message: 'Cricket odds fetched directly from external API',
      source: 'direct-fetch',
      url: url,
      timestamp: new Date().toISOString(),
      data: data
    });

  } catch (error) {
    console.error('💥 Direct fetch odds error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch odds directly', 
      message: error.message,
      source: 'direct-fetch'
    });
  }
});

router.get('/fetch/scorecard/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const url = `http://172.104.206.227:3000/t10score?marketId=${encodeURIComponent(eventId)}`;
    console.log(`🏏 Direct fetch: Fetching scorecard for event ${eventId} from ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Betting-ExternalAPI/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Direct fetch: Scorecard fetched successfully for event ${eventId}`);
    
    res.json({
      success: true,
      message: `Scorecard fetched directly for event ${eventId}`,
      source: 'direct-fetch',
      eventId: eventId,
      url: url,
      timestamp: new Date().toISOString(),
      data: data
    });

  } catch (error) {
    console.error(`💥 Direct fetch scorecard error for event ${req.params.eventId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch scorecard directly', 
      message: error.message,
      eventId: req.params.eventId,
      source: 'direct-fetch'
    });
  }
});

router.get('/fetch/bm/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const url = `https://data.shamexch.xyz/getbm?eventId=${encodeURIComponent(eventId)}`;
    console.log(`🏏 Direct fetch: Fetching BM odds for event ${eventId} from ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Betting-ExternalAPI/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Direct fetch: BM odds fetched successfully for event ${eventId}`);
    
    res.json({
      success: true,
      message: `BM odds fetched directly for event ${eventId}`,
      source: 'direct-fetch',
      eventId: eventId,
      url: url,
      timestamp: new Date().toISOString(),
      data: data
    });

  } catch (error) {
    console.error(`💥 Direct fetch BM odds error for event ${req.params.eventId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch BM odds directly', 
      message: error.message,
      eventId: req.params.eventId,
      source: 'direct-fetch'
    });
  }
});

// Direct fetch casino results
router.get('/fetch/casino-results', async (req, res) => {
  try {
    const url = 'https://marketsarket.qnsports.live/casinoresult';
    console.log(`🎰 Direct fetch: Fetching casino results from ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Betting-ExternalAPI/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Direct fetch: Casino results fetched successfully`);
    
    res.json({
      success: true,
      message: 'Casino results fetched directly from external API',
      source: 'direct-fetch',
      url: url,
      timestamp: new Date().toISOString(),
      data: data
    });

  } catch (error) {
    console.error('💥 Direct fetch casino results error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch casino results directly', 
      message: error.message,
      source: 'direct-fetch'
    });
  }
});

module.exports = router;