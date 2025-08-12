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

module.exports = router;