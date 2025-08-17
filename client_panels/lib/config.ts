// Configuration file for API endpoints and WebSocket URLs
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001',
  },
  
  // Endpoints
  endpoints: {
    cricketMatches: '/provider/cricketmatches',
    odds: '/api/odds',
    auth: '/public-auth/login',
    casino: '/externalapi/casino',
  },
  
  // WebSocket events
  wsEvents: {
    inplayMatches: 'inplay_matches',
    matchUpdate: 'match_update',
    scoreUpdate: 'score_update',
    oddsUpdate: 'odds_update',
    statusChange: 'status_change',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${config.api.baseUrl}${endpoint}`;
};

// Helper function to get WebSocket URL
export const getWsUrl = (): string => {
  return config.api.wsUrl;
};
