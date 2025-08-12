const registerCricketSocket = require('./cricketSocket');
const registerCasinoSocket = require('./casinoSocket');
// Optional odds socket; guard require if file is absent
let registerCricketOddsSocket = () => {};
try {
  registerCricketOddsSocket = require('./cricketOddsSocket');
} catch (_) {
  registerCricketOddsSocket = () => {};
}
const socketAuth = require('../../shared/middleware/socketAuth');
const { connect, subscribe } = require('../../shared/redisPubSub');

module.exports = function registerSockets(io) {
  io.use(socketAuth({ allowAnonymous: false }));

  io.on('connection', (socket) => {
    socket.emit('panel:settings', socket.data?.panelSettings || null);
    socket.on('get:panel-settings', (ack) => {
      if (typeof ack === 'function') ack(socket.data?.panelSettings || null);
      else socket.emit('panel:settings', socket.data?.panelSettings || null);
    });
  });

  // Cross-instance pubsub bridge
  connect().then(() => {
    subscribe('cricket:fixtures:updated', () => {
      io.emit('cricket:fixtures:refresh');
    });
    subscribe('cricket:odds:updated', ({ eventId } = {}) => {
      if (eventId) io.to(`scorecard:${eventId}`).emit('cricket:odds:refresh', { eventId });
      else io.emit('cricket:odds:refresh');
    });
    subscribe('cricket:scorecard:detailed:updated', ({ eventId } = {}) => {
      if (eventId) io.to(`scorecard:${eventId}`).emit('cricket:scorecard:detailed:refresh', { eventId });
    });
    subscribe('cricket:scorecards:updated', ({ count } = {}) => {
      io.emit('cricket:scorecards:refresh', { count: count || 0 });
    });
    subscribe('casino:results:updated', ({ count } = {}) => {
      io.emit('casino:results:refresh', { count: count || 0 });
    });
  }).catch(() => {});

  registerCricketSocket(io);
  registerCasinoSocket(io);
  // Only register if available
  if (typeof registerCricketOddsSocket === 'function') {
    registerCricketOddsSocket(io);
  }
};