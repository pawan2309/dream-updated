const jwt = require('jsonwebtoken');

function parsePanelSettings(input) {
  if (!input) return null;
  if (typeof input === 'object') return input;
  try { return JSON.parse(input); } catch { return null; }
}

function socketAuth(options = {}) {
  const { jwtSecret = process.env.JWT_SECRET } = options;

  return (socket, next) => {
    try {
      const { auth = {}, query = {} } = socket.handshake || {};
      const token = auth.token || query.token;
      const userId = auth.userId || query.userId;
      const panelSettings = auth.panelSettings || query.panelSettings;

      if (token && jwtSecret) {
        try {
          const payload = jwt.verify(token, jwtSecret);
          socket.data.user = payload;
          socket.data.panelSettings = payload.panelSettings || parsePanelSettings(panelSettings) || null;
          return next();
        } catch (e) {
          return next(new Error('Unauthorized: invalid token'));
        }
      }

      if (!token && userId) {
        socket.data.user = { userId };
        socket.data.panelSettings = parsePanelSettings(panelSettings) || null;
        return next();
      }

      // Allow anonymous with explicit opt-in if configured
      if (options.allowAnonymous) {
        socket.data.user = null;
        socket.data.panelSettings = parsePanelSettings(panelSettings) || null;
        return next();
      }

      return next(new Error('Unauthorized: token or userId required'));
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  };
}

module.exports = socketAuth;