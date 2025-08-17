import { useState, useCallback } from 'react';

interface Bet {
  id: string;
  marketId: string;
  selectionId: string;
  selectionName: string;
  odds: number;
  stake: number;
  type: 'back' | 'lay';
  marketName: string;
  status: 'pending' | 'matched' | 'won' | 'lost';
  createdAt: Date;
}

interface BetPlacementState {
  bets: Bet[];
  isLoading: boolean;
  error: string | null;
  userBalance: number;
}

interface BetPlacementActions {
  placeBet: (betData: Omit<Bet, 'id' | 'status' | 'createdAt'>, stake: number) => Promise<boolean>;
  updateBetStatus: (betId: string, status: Bet['status']) => void;
  getUserBalance: () => Promise<number>;
  clearError: () => void;
}

export function useBetPlacement(): BetPlacementState & BetPlacementActions {
  const [state, setState] = useState<BetPlacementState>({
    bets: [],
    isLoading: false,
    error: null,
    userBalance: 0
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const getUserBalance = useCallback(async (): Promise<number> => {
    try {
      // TODO: Replace with actual API call to get user balance
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
      const response = await fetch(`${baseUrl}/api/user/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header here
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user balance');
      }

      const result = await response.json();
      if (result.success && result.data) {
        const balance = result.data.balance || 0;
        setState(prev => ({ ...prev, userBalance: balance }));
        return balance;
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      setState(prev => ({ ...prev, error: 'Failed to fetch user balance' }));
      return 0;
    }
  }, []);

  const placeBet = useCallback(async (
    betData: Omit<Bet, 'id' | 'status' | 'createdAt'>, 
    stake: number
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Validate stake against user balance
      if (stake > state.userBalance) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Insufficient balance' 
        }));
        return false;
      }

      // Create bet object
      const newBet: Bet = {
        ...betData,
        id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        stake,
        status: 'pending',
        createdAt: new Date()
      };

      // Optimistic UI update - deduct stake immediately
      setState(prev => ({
        ...prev,
        userBalance: prev.userBalance - stake,
        bets: [...prev.bets, newBet]
      }));

      // TODO: Replace with actual API call to place bet
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
      const response = await fetch(`${baseUrl}/api/bets/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header here
        },
        body: JSON.stringify({
          marketId: betData.marketId,
          selectionId: betData.selectionId,
          odds: betData.odds,
          stake,
          type: betData.type,
          matchId: window.location.pathname.split('/').pop() // Extract match ID from URL
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to place bet');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update bet status to matched
        setState(prev => ({
          ...prev,
          isLoading: false,
          bets: prev.bets.map(bet => 
            bet.id === newBet.id ? { ...bet, status: 'matched' } : bet
          )
        }));
        
        // Show success message (you can implement a toast notification here)
        console.log('Bet placed successfully');
        return true;
      } else {
        throw new Error(result.error || 'Failed to place bet');
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      
      // Revert optimistic update on error
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to place bet',
        userBalance: prev.userBalance + stake,
        bets: prev.bets.filter(bet => bet.id !== `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
      }));
      
      return false;
    }
  }, [state.userBalance]);

  const updateBetStatus = useCallback((betId: string, status: Bet['status']) => {
    setState(prev => ({
      ...prev,
      bets: prev.bets.map(bet => 
        bet.id === betId ? { ...bet, status } : bet
      )
    }));
  }, []);

  return {
    ...state,
    placeBet,
    updateBetStatus,
    getUserBalance,
    clearError
  };
}
