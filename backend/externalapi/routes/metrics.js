const express = require('express');
const client = require('prom-client');

const router = express.Router();

// Default metrics
client.collectDefaultMetrics();

// Custom metrics
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 3, 5]
});

const redisOps = new client.Counter({
  name: 'redis_operations_total',
  help: 'Number of Redis operations',
  labelNames: ['op']
});

// Middleware to track duration
function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
  });
  next();
}

router.use(metricsMiddleware);

router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

module.exports = { router, metrics: { httpDuration, redisOps } };