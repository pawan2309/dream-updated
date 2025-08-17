const jwt = require('jsonwebtoken');
const config = require('../../config');

function parsePanelSettings(input) {
  if (!input) return null;
  if (typeof input === 'object') return input;
  try { return JSON.parse(input); } catch { return null; }
}

function jwtAuth(options = {}) {
  const secret = options.jwtSecret || config.jwtSecret;
  const allowAnonymous = options.allowAnonymous || false;

  return (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'] || '';
      const bearer = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      const token = bearer || req.query.token || req.body?.token;
      const userId = req.query.userId || req.body?.userId;
      const rawPanel = req.query.panelSettings || req.body?.panelSettings;

      if (token && secret) {
        try {
          const payload = jwt.verify(token, secret);
          console.log('🔍 [JWT] Token verified successfully:', {
            hasPayload: !!payload,
            payloadKeys: payload ? Object.keys(payload) : [],
            userId: payload?.userId
          });
          req.user = payload;
          req.panelSettings = payload.panelSettings || parsePanelSettings(rawPanel) || null;
          return next();
        } catch (e) {
          console.error('❌ [JWT] Token verification failed:', e.message);
          return res.status(401).json({ error: 'Unauthorized: invalid token' });
        }
      }

      if (!token && userId) {
        req.user = { userId };
        req.panelSettings = parsePanelSettings(rawPanel) || null;
        return next();
      }

      if (allowAnonymous) {
        req.user = null;
        req.panelSettings = parsePanelSettings(rawPanel) || null;
        return next();
      }

      return res.status(401).json({ error: 'Unauthorized' });
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

module.exports = jwtAuth;