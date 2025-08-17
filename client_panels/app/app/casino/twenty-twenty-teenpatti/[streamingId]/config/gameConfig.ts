// Game Configuration for Teen Patti 20-20
export const GAME_CONFIG = {
  // Game Settings
  GAME_NAME: 'Teen Patti 20-20',
  GAME_TYPE: 'Teen20',
  ROUND_DURATION: 20, // seconds
  CARD_DISPLAY_DURATION: 5, // seconds
  
  // Default Odds
  DEFAULT_ODDS: {
    playerA: 1.97,
    playerB: 1.97
  },
  
  // UI Constants
  UI: {
    HEADER_HEIGHT: '60px',
    MAX_WIDTH: '7xl',
    GRID_GAP: 6,
    CARD_ANIMATION_DURATION: 300,
    HOVER_TRANSITION: 'all duration-300',
    SHADOW: 'shadow-lg',
    BACKDROP_BLUR: 'backdrop-blur-sm'
  },
  
  // Colors
  COLORS: {
    PRIMARY: {
      light: 'from-purple-500 to-indigo-600',
      hover: 'from-purple-400 to-indigo-500'
    },
    SUCCESS: {
      light: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-500'
    },
    ERROR: {
      light: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-500'
    },
    WARNING: {
      light: 'bg-yellow-100',
      text: 'text-yellow-800'
    },
    NEUTRAL: {
      light: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200'
    }
  },
  
  // API Endpoints
  API_ENDPOINTS: {
    BALANCE: '/api/user/balance',
    ODDS: '/api/user/odds',
    GAME_RESULT: '/api/casino/result',
    ROUND_INFO: '/api/casino/round',
    CASINO_DATA: '/api/casino-data'
  },
  
  // Responsive Breakpoints
  BREAKPOINTS: {
    MOBILE: 'sm',
    TABLET: 'md',
    DESKTOP: 'lg',
    LARGE_DESKTOP: 'xl'
  },
  
  // Animation Durations
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  }
} as const;

// Game Status Messages
export const GAME_MESSAGES = {
  LOADING: 'Loading...',
  CONNECTING: 'Connecting...',
  CONNECTED: 'Connected',
  ERROR: 'Error',
  BETTING_OPEN: 'Betting Open',
  ROUND_ACTIVE: 'Round Active',
  STREAM_NOT_AVAILABLE: 'Stream Not Available',
  FAILED_TO_FETCH_BALANCE: 'Failed to fetch balance',
  BACK_TO_CASINO: '← Back to Casino',
  ROUND_RESULT: 'Round Result',
  PLAYER_A: 'Player A',
  PLAYER_B: 'Player B',
  WINS: 'Wins!',
  NO_AUTH_TOKEN: 'No authentication token'
} as const;

// SEO Configuration
export const SEO_CONFIG = {
  TITLE: 'Teen Patti 20-20 - Live Casino Game | 2XBAT',
  DESCRIPTION: 'Play Teen Patti 20-20 live casino game with real-time betting, instant results, and exciting gameplay. Join thousands of players now!',
  KEYWORDS: 'teen patti, casino game, live betting, online casino, card game, 20-20, real money',
  OG_IMAGE: '/images/teen-patti-og.jpg'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  BALANCE_ERROR: 'Failed to fetch balance. Please refresh.',
  STREAM_ERROR: 'Game stream is currently unavailable.',
  BET_ERROR: 'Failed to place bet. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
} as const;

// Loading States
export const LOADING_STATES = {
  INITIAL: 'initial',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;
