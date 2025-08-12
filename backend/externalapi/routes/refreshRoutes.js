const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const logger = require('../utils/logger');
const { addFetchFixturesJob } = require('../queues/cricketQueue');
const { addFetchCasinoResultsJob } = require('../queues/casinoQueue');
const { fetchCricketOddsData } = require('../jobs/fetchCricketOddsData');
const { fetchCricketDetailedScorecards } = require('../jobs/fetchCricketDetailedScorecards');
const config = require('../../config');

const refreshLimiter = rateLimit({
  windowMs: config.rateLimit.refreshWindowMs,
  max: config.rateLimit.refreshMax
});

router.post('/externalapi/refresh/fixtures', refreshLimiter, async (req, res) => {
  try {
    await addFetchFixturesJob();
    res.status(202).json({ status: 'queued' });
  } catch (error) {
    logger.error('refresh fixtures error:', error);
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/externalapi/refresh/casino', refreshLimiter, async (req, res) => {
  try {
    await addFetchCasinoResultsJob();
    res.status(202).json({ status: 'queued' });
  } catch (error) {
    logger.error('refresh casino error:', error);
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/externalapi/refresh/scorecard/:eventId', refreshLimiter, async (req, res) => {
  try {
    const { eventId } = req.params;
    await fetchCricketDetailedScorecards(eventId);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('refresh scorecard error:', error);
    res.status(500).json({ error: 'failed' });
  }
});

router.post('/externalapi/refresh/odds/:eventId', refreshLimiter, async (req, res) => {
  try {
    const { eventId } = req.params;
    await fetchCricketOddsData(eventId);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('refresh odds error:', error);
    res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;