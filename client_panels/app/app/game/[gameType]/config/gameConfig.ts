export const GAME_CONFIG = {
  UI: {
    MAX_WIDTH: '7xl',
    GRID_GAP: '6',
    CARD_HEIGHT: 'h-32',
    ODDS_BUTTON_HEIGHT: 'h-12',
  },
  
  GAMES: {
    'teenpatti': {
      displayName: 'Teen Patti 20-20',
      description: 'Indian Poker with fast-paced betting',
      image: '/images/teen patti.png',
      markets: [
        {
          id: 'player_bets',
          name: 'Player Bets',
          type: 'player_selection',
          options: [
            { id: 'player_1', name: 'Player 1', odds: 1.95, color: 'blue' },
            { id: 'player_2', name: 'Player 2', odds: 1.95, color: 'green' },
            { id: 'player_3', name: 'Player 3', odds: 1.95, color: 'purple' },
          ]
        },
        {
          id: 'pair_trail',
          name: 'Pair/Trail',
          type: 'outcome_selection',
          options: [
            { id: 'pair', name: 'Pair', odds: 2.50, color: 'orange' },
            { id: 'trail', name: 'Trail', odds: 8.00, color: 'red' },
            { id: 'high_card', name: 'High Card', odds: 1.85, color: 'teal' },
          ]
        },
        {
          id: 'suit_bets',
          name: 'Suit Bets',
          type: 'suit_selection',
          options: [
            { id: 'hearts', name: '♥ Hearts', odds: 3.20, color: 'red' },
            { id: 'diamonds', name: '♦ Diamonds', odds: 3.20, color: 'red' },
            { id: 'clubs', name: '♣ Clubs', odds: 3.20, color: 'black' },
            { id: 'spades', name: '♠ Spades', odds: 3.20, color: 'black' },
          ]
        }
      ]
    },
    
    'dragontiger': {
      displayName: 'Dragon Tiger 20-20',
      description: 'Asian card game with simple betting',
      image: '/images/dt.png',
      markets: [
        {
          id: 'main_bets',
          name: 'Main Bets',
          type: 'outcome_selection',
          options: [
            { id: 'dragon', name: '🐉 Dragon', odds: 1.95, color: 'red' },
            { id: 'tie', name: '⚖️ Tie', odds: 8.00, color: 'purple' },
            { id: 'tiger', name: '🐯 Tiger', odds: 1.95, color: 'blue' },
          ]
        },
        {
          id: 'card_bets',
          name: 'Card Bets',
          type: 'card_selection',
          options: [
            { id: 'ace', name: 'A', odds: 12.00, color: 'green' },
            { id: 'king', name: 'K', odds: 12.00, color: 'green' },
            { id: 'queen', name: 'Q', odds: 12.00, color: 'green' },
            { id: 'jack', name: 'J', odds: 12.00, color: 'green' },
            { id: 'ten', name: '10', odds: 12.00, color: 'green' },
          ]
        }
      ]
    },
    
    'andarbahar': {
      displayName: 'Andar Bahar',
      description: 'Traditional Indian card game',
      image: '/images/ab.png',
      markets: [
        {
          id: 'side_bets',
          name: 'Side Bets',
          type: 'outcome_selection',
          options: [
            { id: 'andar', name: '⬅️ Andar', odds: 1.90, color: 'green' },
            { id: 'bahar', name: '➡️ Bahar', odds: 1.90, color: 'blue' },
          ]
        },
        {
          id: 'card_bets',
          name: 'Card Bets',
          type: 'card_selection',
          options: [
            { id: 'ace', name: 'A', odds: 25.00, color: 'red' },
            { id: 'king', name: 'K', odds: 25.00, color: 'red' },
            { id: 'queen', name: 'Q', odds: 25.00, color: 'red' },
            { id: 'jack', name: 'J', odds: 25.00, color: 'red' },
            { id: 'ten', name: '10', odds: 25.00, color: 'red' },
          ]
        }
      ]
    },
    
    'lucky7': {
      displayName: 'Lucky 7',
      description: 'Card-based luck game',
      image: '/images/lucky7.png',
      markets: [
        {
          id: 'main_bets',
          name: 'Main Bets',
          type: 'outcome_selection',
          options: [
            { id: 'low', name: '⬇️ Low (2-6)', odds: 1.97, color: 'blue' },
            { id: 'seven', name: '🎯 Seven', odds: 15.00, color: 'red' },
            { id: 'high', name: '⬆️ High (8-K)', odds: 1.97, color: 'green' },
          ]
        },
        {
          id: 'suit_bets',
          name: 'Suit Bets',
          type: 'suit_selection',
          options: [
            { id: 'hearts', name: '♥ Hearts', odds: 3.20, color: 'red' },
            { id: 'diamonds', name: '♦ Diamonds', odds: 3.20, color: 'red' },
            { id: 'clubs', name: '♣ Clubs', odds: 3.20, color: 'black' },
            { id: 'spades', name: '♠ Spades', odds: 3.20, color: 'black' },
          ]
        },
        {
          id: 'number_bets',
          name: 'Number Bets',
          type: 'number_selection',
          options: [
            { id: 'even', name: '🔢 Even', odds: 2.07, color: 'purple' },
            { id: 'odd', name: '🔢 Odd', odds: 1.76, color: 'orange' },
          ]
        }
      ]
    },
    
    'thirtytwocard': {
      displayName: '32 Cards',
      description: 'Multi-player card game',
      image: '/images/32cards.png',
      markets: [
        {
          id: 'player_bets',
          name: 'Player Bets',
          type: 'player_selection',
          options: [
            { id: 'player_8', name: 'Player 8', odds: 1.95, color: 'blue' },
            { id: 'player_9', name: 'Player 9', odds: 1.95, color: 'green' },
            { id: 'player_10', name: 'Player 10', odds: 1.95, color: 'purple' },
            { id: 'player_11', name: 'Player 11', odds: 1.95, color: 'orange' },
          ]
        },
        {
          id: 'bet_type',
          name: 'Bet Type',
          type: 'outcome_selection',
          options: [
            { id: 'back', name: '📈 Back', odds: 1.95, color: 'green' },
            { id: 'lay', name: '📉 Lay', odds: 1.95, color: 'red' },
          ]
        }
      ]
    },
    
    'aaa': {
      displayName: 'Amar Akbar Anthony',
      description: 'Three-player betting game',
      image: '/images/32cards.png',
      markets: [
        {
          id: 'player_bets',
          name: 'Player Bets',
          type: 'player_selection',
          options: [
            { id: 'amar', name: '👨 Amar', odds: 1.95, color: 'red' },
            { id: 'akbar', name: '👨 Akbar', odds: 1.95, color: 'green' },
            { id: 'anthony', name: '👨 Anthony', odds: 1.95, color: 'blue' },
          ]
        },
        {
          id: 'outcome_bets',
          name: 'Outcome Bets',
          type: 'outcome_selection',
          options: [
            { id: 'winner', name: '🏆 Winner', odds: 2.50, color: 'purple' },
            { id: 'runner_up', name: '🥈 Runner Up', odds: 3.00, color: 'orange' },
          ]
        }
      ]
    }
  },
  
  COLORS: {
    PRIMARY: {
      light: 'from-blue-500 to-blue-600',
      hover: 'from-blue-400 to-blue-500',
    },
    SUCCESS: {
      light: 'from-green-500 to-green-600',
      hover: 'from-green-400 to-green-500',
    },
    DANGER: {
      light: 'from-red-500 to-red-600',
      hover: 'from-red-400 to-red-500',
    },
    WARNING: {
      light: 'from-yellow-500 to-yellow-600',
      hover: 'from-yellow-400 to-yellow-500',
    }
  },
  
  BETTING: {
    MIN_STAKE: 10,
    MAX_STAKE: 100000,
    STAKE_STEPS: [10, 50, 100, 500, 1000, 5000, 10000],
    MAX_BETS_PER_ROUND: 5,
  },
  
  TIMING: {
    BETTING_DURATION: 30, // seconds
    RESULT_DISPLAY: 10, // seconds
    ROUND_INTERVAL: 5, // seconds
  }
}

export const GAME_MESSAGES = {
  BETTING_OPEN: '🎯 Betting Open',
  ROUND_ACTIVE: '⚡ Round Active',
  BETTING_CLOSED: '⏸️ Betting Closed',
  ROUND_ENDED: '🏁 Round Ended',
  CONNECTING: 'Connecting...',
  CONNECTED: 'Connected',
  ERROR: 'Connection Error',
  STREAM_NOT_AVAILABLE: 'Stream Not Available',
  BACK_TO_CASINO: 'Back to Casino',
  LOADING: 'Loading...',
  NO_BETS: 'No bets placed',
  BET_PLACED: 'Bet placed successfully!',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  BET_LIMIT_EXCEEDED: 'Bet limit exceeded',
}

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error',
  GAME_NOT_FOUND: 'Game not found',
  INVALID_BET: 'Invalid bet amount',
  BETTING_CLOSED: 'Betting is currently closed',
  MAX_BETS_REACHED: 'Maximum bets reached for this round',
  BALANCE_LOW: 'Insufficient balance for this bet',
}
