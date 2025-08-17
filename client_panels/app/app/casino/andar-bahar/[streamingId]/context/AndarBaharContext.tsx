import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Types
interface AndarBaharState {
  streamingId: string;
  roundId: string | null;
  timeLeft: number;
  isBettingOpen: boolean;
  odds: {
    andar: number;
    bahar: number;
  };
  userBalance: number;
  jokerCard: string | null;
  drawnCards: {
    andar: string[];
    bahar: string[];
  };
  gameStatus: 'waiting' | 'betting' | 'playing' | 'finished';
  winner: 'andar' | 'bahar' | null;
  recentResults: ('andar' | 'bahar')[];
  loading: boolean;
  error: string | null;
}

type AndarBaharAction =
  | { type: 'SET_ROUND_ID'; payload: string }
  | { type: 'SET_TIME_LEFT'; payload: number }
  | { type: 'SET_BETTING_OPEN'; payload: boolean }
  | { type: 'SET_ODDS'; payload: { andar: number; bahar: number } }
  | { type: 'SET_USER_BALANCE'; payload: number }
  | { type: 'SET_JOKER_CARD'; payload: string }
  | { type: 'ADD_DRAWN_CARD'; payload: { side: 'andar' | 'bahar'; card: string } }
  | { type: 'SET_GAME_STATUS'; payload: 'waiting' | 'betting' | 'playing' | 'finished' }
  | { type: 'SET_WINNER'; payload: 'andar' | 'bahar' | null }
  | { type: 'ADD_RESULT'; payload: 'andar' | 'bahar' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_ROUND' };

// Initial state
const initialState: AndarBaharState = {
  streamingId: '',
  roundId: null,
  timeLeft: 30,
  isBettingOpen: true,
  odds: {
    andar: 1.97,
    bahar: 1.97
  },
  userBalance: 0,
  jokerCard: null,
  drawnCards: {
    andar: [],
    bahar: []
  },
  gameStatus: 'waiting',
  winner: null,
  recentResults: [],
  loading: false,
  error: null
};

// Reducer
function andarBaharReducer(state: AndarBaharState, action: AndarBaharAction): AndarBaharState {
  switch (action.type) {
    case 'SET_ROUND_ID':
      return { ...state, roundId: action.payload };
    
    case 'SET_TIME_LEFT':
      return { ...state, timeLeft: action.payload };
    
    case 'SET_BETTING_OPEN':
      return { ...state, isBettingOpen: action.payload };
    
    case 'SET_ODDS':
      return { ...state, odds: action.payload };
    
    case 'SET_USER_BALANCE':
      return { ...state, userBalance: action.payload };
    
    case 'SET_JOKER_CARD':
      return { ...state, jokerCard: action.payload };
    
    case 'ADD_DRAWN_CARD':
      return {
        ...state,
        drawnCards: {
          ...state.drawnCards,
          [action.payload.side]: [...state.drawnCards[action.payload.side], action.payload.card]
        }
      };
    
    case 'SET_GAME_STATUS':
      return { ...state, gameStatus: action.payload };
    
    case 'SET_WINNER':
      return { ...state, winner: action.payload };
    
    case 'ADD_RESULT':
      return { 
        ...state, 
        recentResults: [action.payload, ...state.recentResults.slice(0, 9)] 
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'RESET_ROUND':
      return {
        ...state,
        roundId: null,
        timeLeft: 30,
        isBettingOpen: true,
        jokerCard: null,
        drawnCards: { andar: [], bahar: [] },
        gameStatus: 'waiting',
        winner: null
      };
    
    default:
      return state;
  }
}

// Context
interface AndarBaharContextType {
  state: AndarBaharState;
  actions: {
    setRoundId: (roundId: string) => void;
    setTimeLeft: (time: number) => void;
    setBettingOpen: (open: boolean) => void;
    setOdds: (andar: number, bahar: number) => void;
    setUserBalance: (balance: number) => void;
    setJokerCard: (card: string) => void;
    addDrawnCard: (side: 'andar' | 'bahar', card: string) => void;
    setGameStatus: (status: 'waiting' | 'betting' | 'playing' | 'finished') => void;
    setWinner: (winner: 'andar' | 'bahar' | null) => void;
    addResult: (result: 'andar' | 'bahar') => void;
    placeBet: (side: 'andar' | 'bahar', amount: number) => Promise<void>;
    fetchUserBalance: () => Promise<void>;
    fetchOdds: () => Promise<void>;
    resetRound: () => void;
  };
}

const AndarBaharContext = createContext<AndarBaharContextType | undefined>(undefined);

// Provider component
export function AndarBaharProvider({ children, streamingId }: { children: React.ReactNode; streamingId: string }) {
  const [state, dispatch] = useReducer(andarBaharReducer, { ...initialState, streamingId });

  // Timer effect
  useEffect(() => {
    if (state.timeLeft > 0 && state.isBettingOpen) {
      const timer = setInterval(() => {
        dispatch({ type: 'SET_TIME_LEFT', payload: state.timeLeft - 1 });
      }, 1000);

      return () => clearInterval(timer);
    } else if (state.timeLeft === 0 && state.isBettingOpen) {
      dispatch({ type: 'SET_BETTING_OPEN', payload: false });
      dispatch({ type: 'SET_GAME_STATUS', payload: 'playing' });
    }
  }, [state.timeLeft, state.isBettingOpen]);

  // Auto-reset round after showing winner
  useEffect(() => {
    if (state.winner && state.gameStatus === 'finished') {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET_ROUND' });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.winner, state.gameStatus]);

  // Actions
  const actions = {
    setRoundId: useCallback((roundId: string) => {
      dispatch({ type: 'SET_ROUND_ID', payload: roundId });
    }, []),

    setTimeLeft: useCallback((time: number) => {
      dispatch({ type: 'SET_TIME_LEFT', payload: time });
    }, []),

    setBettingOpen: useCallback((open: boolean) => {
      dispatch({ type: 'SET_BETTING_OPEN', payload: open });
    }, []),

    setOdds: useCallback((andar: number, bahar: number) => {
      dispatch({ type: 'SET_ODDS', payload: { andar, bahar } });
    }, []),

    setUserBalance: useCallback((balance: number) => {
      dispatch({ type: 'SET_USER_BALANCE', payload: balance });
    }, []),

    setJokerCard: useCallback((card: string) => {
      dispatch({ type: 'SET_JOKER_CARD', payload: card });
    }, []),

    addDrawnCard: useCallback((side: 'andar' | 'bahar', card: string) => {
      dispatch({ type: 'ADD_DRAWN_CARD', payload: { side, card } });
    }, []),

    setGameStatus: useCallback((status: 'waiting' | 'betting' | 'playing' | 'finished') => {
      dispatch({ type: 'SET_GAME_STATUS', payload: status });
    }, []),

    setWinner: useCallback((winner: 'andar' | 'bahar' | null) => {
      dispatch({ type: 'SET_WINNER', payload: winner });
    }, []),

    addResult: useCallback((result: 'andar' | 'bahar') => {
      dispatch({ type: 'ADD_RESULT', payload: result });
    }, []),

    placeBet: useCallback(async (side: 'andar' | 'bahar', amount: number) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token');
        }

        const response = await fetch(`/api/casino/bet`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            streamingId: state.streamingId,
            roundId: state.roundId,
            side,
            amount,
            gameType: 'AndarBahar'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to place bet');
        }

        const data = await response.json();
        if (data.success) {
          // Update user balance
          actions.fetchUserBalance();
        } else {
          throw new Error(data.message || 'Bet placement failed');
        }
      } catch (error) {
        console.error('Error placing bet:', error);
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, [state.streamingId, state.roundId]),

    fetchUserBalance: useCallback(async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`/api/user/balance`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.balance !== undefined) {
            dispatch({ type: 'SET_USER_BALANCE', payload: data.balance });
          }
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }, []),

    fetchOdds: useCallback(async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`/api/user/odds`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.odds) {
            dispatch({ type: 'SET_ODDS', payload: data.odds });
          }
        }
      } catch (error) {
        console.error('Error fetching odds:', error);
      }
    }, []),

    resetRound: useCallback(() => {
      dispatch({ type: 'RESET_ROUND' });
    }, [])
  };

  // Fetch initial data
  useEffect(() => {
    actions.fetchUserBalance();
    actions.fetchOdds();
  }, [actions.fetchUserBalance, actions.fetchOdds]);

  const value: AndarBaharContextType = { state, actions };

  return (
    <AndarBaharContext.Provider value={value}>
      {children}
    </AndarBaharContext.Provider>
  );
}

// Hook
export function useAndarBahar() {
  const context = useContext(AndarBaharContext);
  if (context === undefined) {
    throw new Error('useAndarBahar must be used within an AndarBaharProvider');
  }
  return context;
}
