const express = require('express');
const router = express.Router();
const redis = require('../utils/redisClient');

router.get('/externalapi/admin/cricket/fixtures/raw', async (req, res) => {
  try {
    const data = await redis.get('cricket:fixtures');
    res.status(200).json({ data: data || [] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read Redis' });
  }
});

router.get('/externalapi/admin/casino/results/raw', async (req, res) => {
  try {
    const data = await redis.get('casino:results');
    res.status(200).json({ data: data || [] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read Redis' });
  }
});

module.exports = router;