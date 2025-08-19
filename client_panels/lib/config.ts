// Configuration file for API endpoints and WebSocket URLs
export const config = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001',
  websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
}

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${config.baseUrl}${endpoint}`;
};

// Helper function to get WebSocket URL
export const getWsUrl = (): string => {
  return config.wsUrl;
};
