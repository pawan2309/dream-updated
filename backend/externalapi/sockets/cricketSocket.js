const redis = require('../utils/redisClient');
const logger = require('../utils/logger');
const { filterByPanelSettings } = require('../../shared/utils/filterByPanelSettings');
const { getDetailedScorecardSnapshot } = require('../services/scorecardService');
const { getOddsSnapshot } = require('../services/oddsService');

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

async function emitScorecardAndOdds(io, socket, eventId, room) {
  try {
    const [score, odds] = await Promise.all([
      getDetailedScorecardSnapshot(eventId),
      getOddsSnapshot(eventId)
    ]);

    if (score) {
      if (room) io.to(room).emit('cricket:scorecard:detailed', score);
      else socket.emit('cricket:scorecard:detailed', score);
    }
    if (odds) {
      if (room) io.to(room).emit('cricket:odds', odds);
      else socket.emit('cricket:odds', odds);
    }
  } catch (e) {
    logger.error('emitScorecardAndOdds error:', e);
  }
}

function registerCricketSocket(io) {
  io.on('connection', async (socket) => {
    const panelSettings = resolvePanelSettings(socket);

    // Emit fixtures snapshot (with filtering) on connect
    try {
      const fixtures = await redis.get('cricket:fixtures');
      if (fixtures) {
        const filtered = filterByPanelSettings(fixtures, panelSettings || {});
        socket.emit('cricket:fixtures', filtered);
      }
    } catch (err) {
      logger.error('Failed to emit cricket fixtures snapshot:', err);
    }

    // Maintain per-socket intervals for dynamic scorecards
    const scorecardIntervals = new Map(); // eventId -> intervalId

    // Shared join logic
    async function handleJoinScorecard(eventId) {
      if (!eventId) return;
      const room = `scorecard:${eventId}`;
      socket.join(room);

      // Initial emit: both detailed scorecard and odds
      await emitScorecardAndOdds(io, socket, eventId, null); // to this socket directly

      // Start periodic re-emit every 10s for this eventId (if not already started)
      if (!scorecardIntervals.has(eventId)) {
        const intervalId = setInterval(async () => {
          await emitScorecardAndOdds(io, socket, eventId, room); // to room
        }, 10000);
        scorecardIntervals.set(eventId, intervalId);
      }
    }

    // Legacy handler: join with payload { eventId }
    socket.on('join:scorecard', async (payload) => {
      try {
        const eventId = payload && payload.eventId ? String(payload.eventId) : null;
        await handleJoinScorecard(eventId);
      } catch (e) {
        logger.error('join:scorecard handler error:', e);
      }
    });

    // Dynamic event handler: join:scorecard:<eventId>
    if (typeof socket.onAny === 'function') {
      socket.onAny(async (event, ...args) => {
        try {
          if (event && typeof event === 'string' && event.startsWith('join:scorecard:')) {
            const eventId = event.split(':')[2];
            await handleJoinScorecard(eventId);
          }
        } catch (e) {
          logger.error('join:scorecard:<eventId> handler error:', e);
        }
      });
    }

    // Optional periodic re-emit (30s) for fixtures snapshot
    const fixturesInterval = setInterval(async () => {
      try {
        const latest = await redis.get('cricket:fixtures');
        if (latest) {
          const filtered = filterByPanelSettings(latest, panelSettings || {});
          socket.emit('cricket:fixtures', filtered);
        }
      } catch (e) {
        // ignore transient errors
      }
    }, 30000);

    socket.on('disconnect', () => {
      clearInterval(fixturesInterval);
      for (const [, intervalId] of scorecardIntervals) {
        clearInterval(intervalId);
      }
      scorecardIntervals.clear();
    });
  });
}

module.exports = registerCricketSocket;