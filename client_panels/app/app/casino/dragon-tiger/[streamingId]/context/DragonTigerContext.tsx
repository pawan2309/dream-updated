import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Types
interface DragonTigerState {
  streamingId: string;
  roundId: string | null;
  timeLeft: number;
  isBettingOpen: boolean;
  odds: {
    dragon: number;
    tiger: number;
    tie: number;
  };
  userBalance: number;
  dragonCard: string | null;
  tigerCard: string | null;
  gameStatus: 'waiting' | 'betting' | 'playing' | 'finished';
  winner: 'dragon' | 'tiger' | 'tie' | null;
  recentResults: ('dragon' | 'tiger' | 'tie')[];
  loading: boolean;
  error: string | null;
  userBet: {
    side: 'dragon' | 'tiger' | 'tie' | null;
    amount: number;
    potentialWin: number;
  };
}

type DragonTigerAction =
  | { type: 'SET_ROUND_ID'; payload: string }
  | { type: 'SET_TIME_LEFT'; payload: number }
  | { type: 'SET_BETTING_OPEN'; payload: boolean }
  | { type: 'SET_ODDS'; payload: { dragon: number; tiger: number; tie: number } }
  | { type: 'SET_USER_BALANCE'; payload: number }
  | { type: 'SET_DRAGON_CARD'; payload: string }
  | { type: 'SET_TIGER_CARD'; payload: string }
  | { type: 'SET_GAME_STATUS'; payload: 'waiting' | 'betting' | 'playing' | 'finished' }
  | { type: 'SET_WINNER'; payload: 'dragon' | 'tiger' | 'tie' | null }
  | { type: 'ADD_RESULT'; payload: 'dragon' | 'tiger' | 'tie' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_BET'; payload: { side: 'dragon' | 'tiger' | 'tie' | null; amount: number; potentialWin: number } }
  | { type: 'RESET_ROUND' };

// Initial state
const initialState: DragonTigerState = {
  streamingId: '',
  roundId: null,
  timeLeft: 30,
  isBettingOpen: true,
  odds: {
    dragon: 1.97,
    tiger: 1.97,
    tie: 8.0
  },
  userBalance: 0,
  dragonCard: null,
  tigerCard: null,
  gameStatus: 'waiting',
  winner: null,
  recentResults: [],
  loading: false,
  error: null,
  userBet: {
    side: null,
    amount: 0,
    potentialWin: 0
  }
};

// Reducer
function dragonTigerReducer(state: DragonTigerState, action: DragonTigerAction): DragonTigerState {
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
    
    case 'SET_DRAGON_CARD':
      return { ...state, dragonCard: action.payload };
    
    case 'SET_TIGER_CARD':
      return { ...state, tigerCard: action.payload };
    
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
    
    case 'SET_USER_BET':
      return { ...state, userBet: action.payload };
    
    case 'RESET_ROUND':
      return {
        ...state,
        timeLeft: 30,
        isBettingOpen: true,
        dragonCard: null,
        tigerCard: null,
        gameStatus: 'waiting',
        winner: null,
        userBet: { side: null, amount: 0, potentialWin: 0 }
      };
    
    default:
      return state;
  }
}

// Context
interface DragonTigerContextType {
  state: DragonTigerState;
  dispatch: React.Dispatch<DragonTigerAction>;
  placeBet: (side: 'dragon' | 'tiger' | 'tie', amount: number) => Promise<void>;
  fetchUserBalance: () => Promise<void>;
  fetchOdds: () => Promise<void>;
  fetchGameResult: () => Promise<void>;
  fetchRoundInfo: () => Promise<void>;
}

const DragonTigerContext = createContext<DragonTigerContextType | undefined>(undefined);

// Provider
interface DragonTigerProviderProps {
  children: React.ReactNode;
  streamingId: string;
}

export function DragonTigerProvider({ children, streamingId }: DragonTigerProviderProps) {
  const [state, dispatch] = useReducer(dragonTigerReducer, {
    ...initialState,
    streamingId
  });

  // Fetch user balance
  const fetchUserBalance = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/user/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      if (data.success && data.data?.balance !== undefined) {
        dispatch({ type: 'SET_USER_BALANCE', payload: data.data.balance });
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch balance' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Fetch odds
  const fetchOdds = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/user/odds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch odds');
      }

      const data = await response.json();
      if (data.success && data.data?.odds) {
        dispatch({ type: 'SET_ODDS', payload: data.data.odds });
      }
    } catch (error) {
      console.error('Error fetching odds:', error);
      // Use default odds on error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Fetch game result
  const fetchGameResult = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/casino/result/${streamingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch game result');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const { winner, dragonCard, tigerCard, recentResults } = data.data;
        
        if (winner) dispatch({ type: 'SET_WINNER', payload: winner });
        if (dragonCard) dispatch({ type: 'SET_DRAGON_CARD', payload: dragonCard });
        if (tigerCard) dispatch({ type: 'SET_TIGER_CARD', payload: tigerCard });
        
        if (recentResults && Array.isArray(recentResults)) {
          recentResults.forEach(result => {
            dispatch({ type: 'ADD_RESULT', payload: result });
          });
        }
      }
    } catch (error) {
      console.error('Error fetching game result:', error);
    }
  }, [streamingId]);

  // Fetch round info
  const fetchRoundInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/casino/round/${streamingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch round info');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const { roundId, timeLeft, status } = data.data;
        
        if (roundId) dispatch({ type: 'SET_ROUND_ID', payload: roundId });
        if (timeLeft !== undefined) dispatch({ type: 'SET_TIME_LEFT', payload: timeLeft });
        if (status) dispatch({ type: 'SET_GAME_STATUS', payload: status });
      }
    } catch (error) {
      console.error('Error fetching round info:', error);
    }
  }, [streamingId]);

  // Place bet
  const placeBet = useCallback(async (side: 'dragon' | 'tiger' | 'tie', amount: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/casino/bet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          gameType: 'DragonTiger',
          streamingId,
          side,
          amount,
          roundId: state.roundId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to place bet');
      }

      const data = await response.json();
      if (data.success) {
        // Calculate potential winnings
        const potentialWin = amount * state.odds[side];
        dispatch({ 
          type: 'SET_USER_BET', 
          payload: { side, amount, potentialWin } 
        });
        
        // Update balance
        await fetchUserBalance();
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to place bet' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [streamingId, state.roundId, state.odds, fetchUserBalance]);

  // Timer effect
  useEffect(() => {
    if (state.timeLeft > 0 && state.gameStatus === 'betting') {
      const timer = setInterval(() => {
        dispatch({ type: 'SET_TIME_LEFT', payload: state.timeLeft - 1 });
      }, 1000);

      return () => clearInterval(timer);
    } else if (state.timeLeft === 0 && state.gameStatus === 'betting') {
      dispatch({ type: 'SET_BETTING_OPEN', payload: false });
      dispatch({ type: 'SET_GAME_STATUS', payload: 'playing' });
    }
  }, [state.timeLeft, state.gameStatus]);

  // Auto-reset round after result
  useEffect(() => {
    if (state.gameStatus === 'finished' && state.winner) {
      const resetTimer = setTimeout(() => {
        dispatch({ type: 'RESET_ROUND' });
      }, 5000); // 5 seconds delay

      return () => clearTimeout(resetTimer);
    }
  }, [state.gameStatus, state.winner]);

  // Initial data fetch
  useEffect(() => {
    fetchUserBalance();
    fetchOdds();
    fetchRoundInfo();
  }, [fetchUserBalance, fetchOdds, fetchRoundInfo]);

  const value: DragonTigerContextType = {
    state,
    dispatch,
    placeBet,
    fetchUserBalance,
    fetchOdds,
    fetchGameResult,
    fetchRoundInfo
  };

  return (
    <DragonTigerContext.Provider value={value}>
      {children}
    </DragonTigerContext.Provider>
  );
}

// Hook
export function useDragonTiger() {
  const context = useContext(DragonTigerContext);
  if (context === undefined) {
    throw new Error('useDragonTiger must be used within a DragonTigerProvider');
  }
  return context;
}
