const Redis = require('ioredis');
const logger = require('../externalapi/utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';

const pub = new Redis(REDIS_URL, { lazyConnect: true });
const sub = new Redis(REDIS_URL, { lazyConnect: true });

async function connect() {
  await Promise.all([pub.connect(), sub.connect()]);
}

function subscribe(channel, handler) {
  sub.subscribe(channel, (err, count) => {
    if (err) logger.error('Redis SUBSCRIBE error:', err);
  });
  sub.on('message', (chan, message) => {
    if (chan === channel) {
      try {
        const payload = JSON.parse(message);
        handler(payload);
      } catch (e) {
        handler(message);
      }
    }
  });
}

async function publish(channel, payload) {
  try {
    await pub.publish(channel, typeof payload === 'string' ? payload : JSON.stringify(payload));
  } catch (e) {
    logger.error('Redis PUBLISH error:', e);
  }
}

module.exports = { pub, sub, connect, subscribe, publish };