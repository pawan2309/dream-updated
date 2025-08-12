const redis = require('../utils/redisClient');
const logger = require('../utils/logger');
const { filterByPanelSettings } = require('../../shared/utils/filterByPanelSettings');

function resolvePanelSettings(socket) {
  try {
    const fromAuth = socket.handshake?.auth?.panelSettings;
    if (fromAuth && typeof fromAuth === 'object') return fromAuth;
    if (typeof fromAuth === 'string') return JSON.parse(fromAuth);
    const fromQuery = socket.handshake?.query?.panelSettings;
    if (typeof fromQuery === 'string') return JSON.parse(fromQuery);
  } catch (_) {}
  return null;
}

function registerCasinoSocket(io) {
  io.on('connection', async (socket) => {
    const panelSettings = resolvePanelSettings(socket);

    try {
      const results = await redis.get('casino:results');
      if (results) {
        const filtered = filterByPanelSettings(results, panelSettings || {});
        socket.emit('casino:results', filtered);
      }
    } catch (err) {
      logger.error('Failed to emit casino results snapshot:', err);
    }

    // Optional periodic re-emit (30s)
    const interval = setInterval(async () => {
      try {
        const latest = await redis.get('casino:results');
        if (latest) {
          const filtered = filterByPanelSettings(latest, panelSettings || {});
          socket.emit('casino:results', filtered);
        }
      } catch (e) {
        // ignore transient errors
      }
    }, 30000);

    socket.on('disconnect', () => {
      clearInterval(interval);
    });
  });
}

module.exports = registerCasinoSocket;