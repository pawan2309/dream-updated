const express = require('express');
const router = express.Router();
const { runHealthCheck } = require('../jobs/healthCheck');
const redis = require('../utils/redisClient');

// Basic health: uptime
router.get('/externalapi/health', async (req, res) => {
  try {
    const status = await runHealthCheck();
    res.status(200).json({ status: 'ok', uptime: process.uptime(), ...status });
  } catch (error) {
    res.status(500).json({ status: 'down', uptime: process.uptime(), error: error.message });
  }
});

// Simple status: counts of keys (best-effort using SCAN)
router.get('/externalapi/status', async (req, res) => {
  try {
    const client = redis.client;
    let totalKeys = 0;
    if (client) {
      let cursor = '0';
      do {
        const [next, slice] = await client.scan(cursor, 'COUNT', 200);
        cursor = next;
        totalKeys += Array.isArray(slice) ? slice.length : 0;
      } while (cursor !== '0');
    }

    res.status(200).json({
      uptime: process.uptime(),
      redisKeys: totalKeys
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status', message: error.message });
  }
});

// External API health check endpoint
router.get('/external-apis', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'external-api-health',
      apis: {}
    };

    // Check Casino APIs
    try {
      const casinoResponse = await fetch('http://159.65.20.25:3000/getdata/teen20', {
        method: 'GET',
        headers: { 'User-Agent': 'Betting-ExternalAPI/1.0' },
        timeout: 5000
      });
      health.apis.casino = casinoResponse.ok ? 'healthy' : `unhealthy (${casinoResponse.status})`;
    } catch (error) {
      health.apis.casino = 'down';
      health.status = 'DEGRADED';
    }

    // Check Cricket Fixtures API
    try {
      const fixturesResponse = await fetch('https://marketsarket.qnsports.live/cricketmatches', {
        method: 'GET',
        headers: { 'User-Agent': 'Betting-ExternalAPI/1.0' },
        timeout: 5000
      });
      health.apis.cricketFixtures = fixturesResponse.ok ? 'healthy' : `unhealthy (${fixturesResponse.status})`;
    } catch (error) {
      health.apis.cricketFixtures = 'down';
      health.status = 'DEGRADED';
    }

    // Check Cricket Odds API
    try {
      const oddsResponse = await fetch('https://marketsarket.qnsports.live/odds', {
        method: 'GET',
        headers: { 'User-Agent': 'Betting-ExternalAPI/1.0' },
        timeout: 5000
      });
      health.apis.cricketOdds = oddsResponse.ok ? 'healthy' : `unhealthy (${oddsResponse.status})`;
    } catch (error) {
      health.apis.cricketOdds = 'down';
      health.status = 'DEGRADED';
    }

    // Check Cricket Scorecard API
    try {
      const scorecardResponse = await fetch('http://172.104.206.227:3000/t10score?marketId=test', {
        method: 'GET',
        headers: { 'User-Agent': 'Betting-ExternalAPI/1.0' },
        timeout: 5000
      });
      health.apis.cricketScorecard = scorecardResponse.ok ? 'healthy' : `unhealthy (${scorecardResponse.status})`;
    } catch (error) {
      health.apis.cricketScorecard = 'down';
      health.status = 'DEGRADED';
    }

    // Check Casino Results API
    try {
      const casinoResultsResponse = await fetch('https://marketsarket.qnsports.live/casinoresult', {
        method: 'GET',
        headers: { 'User-Agent': 'Betting-ExternalAPI/1.0' },
        timeout: 5000
      });
      health.apis.casinoResults = casinoResultsResponse.ok ? 'healthy' : `unhealthy (${casinoResultsResponse.status})`;
    } catch (error) {
      health.apis.casinoResults = 'down';
      health.status = 'DEGRADED';
    }

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'external-api-health',
      error: error.message
    });
    }
});

module.exports = router;