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
  userChips: number; // Changed from userBalance to userChips
  userExposure: number;
}

interface BetPlacementActions {
  placeBet: (betData: Omit<Bet, 'id' | 'status' | 'createdAt'>, stake: number) => Promise<boolean>;
  updateBetStatus: (betId: string, status: Bet['status']) => void;
  getUserChips: () => Promise<number>; // Changed from getUserBalance to getUserChips
  clearError: () => void;
}

export function useBetPlacement(): BetPlacementState & BetPlacementActions {
  const [state, setState] = useState<BetPlacementState>({
    bets: [],
    isLoading: false,
    error: null,
    userChips: 0, // Changed from userBalance to userChips
    userExposure: 0
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const getUserChips = useCallback(async (): Promise<number> => {
    try {
      console.log('🔍 [GETUSERCHIPS] Starting to fetch user chips...');
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ [GETUSERCHIPS] No authentication token found in localStorage');
        setState(prev => ({ ...prev, error: 'No authentication token' }));
        return 0;
      }
      
      console.log('🔍 [GETUSERCHIPS] Token found:', token.substring(0, 20) + '...');

      // Call the updated balance API to get user chips
      console.log('🔍 [GETUSERCHIPS] Calling /api/user/balance...');
      const response = await fetch('/api/user/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 [GETUSERCHIPS] Response status:', response.status);
      console.log('🔍 [GETUSERCHIPS] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [GETUSERCHIPS] API call failed:', response.status, errorText);
        throw new Error(`Failed to fetch user chips: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🔍 [GETUSERCHIPS] API response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        const chips = result.data.chips || 0;
        const exposure = result.data.exposure || 0;
        
        console.log('✅ [GETUSERCHIPS] Successfully got chips:', chips, 'exposure:', exposure);
        
        setState(prev => ({ 
          ...prev, 
          userChips: chips,
          userExposure: exposure
        }));
        return chips;
      } else {
        console.error('❌ [GETUSERCHIPS] API response invalid:', result);
        throw new Error('Invalid API response format');
      }
      
    } catch (error) {
      console.error('❌ [GETUSERCHIPS] Error fetching user chips:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to fetch user chips' }));
      return 0;
    }
  }, []);

  const placeBet = useCallback(async (
    betData: Omit<Bet, 'id' | 'status' | 'createdAt'>, 
    stake: number
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Validate stake against user chips
      if (stake > state.userChips) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Insufficient chips' 
        }));
        return false;
      }

      // Get authentication token
      const token = localStorage.getItem('authToken');
      if (!token) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'No authentication token' 
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

      // Optimistic UI update - deduct chips immediately
      setState(prev => ({
        ...prev,
        userChips: prev.userChips - stake,
        bets: [...prev.bets, newBet]
      }));

      // Call backend API to place bet
      const response = await fetch('http://localhost:4001/api/bets/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          marketId: betData.marketId,
          selectionId: betData.selectionId,
          selectionName: betData.selectionName,
          odds: betData.odds,
          stake,
          type: betData.type,
          marketName: betData.marketName,
          matchId: window.location.pathname.split('/').pop() // Extract match ID from URL
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to place bet: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update bet status to matched and refresh user chips
        setState(prev => ({
          ...prev,
          isLoading: false,
          userChips: result.data.newChips,
          userExposure: result.data.newExposure,
          bets: prev.bets.map(bet => 
            bet.id === newBet.id ? { ...bet, status: 'matched' } : bet
          )
        }));
        
        console.log('✅ Bet placed successfully:', result.data);
        return true;
      } else {
        throw new Error(result.error || 'Failed to place bet');
      }
    } catch (error) {
      console.error('❌ Error placing bet:', error);
      
      // Revert optimistic update on error
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to place bet',
        userChips: prev.userChips + stake,
        bets: prev.bets.filter(bet => bet.id !== `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
      }));
      
      return false;
    }
  }, [state.userChips]);

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
    getUserChips, // Changed from getUserBalance to getUserChips
    clearError
  };
}
