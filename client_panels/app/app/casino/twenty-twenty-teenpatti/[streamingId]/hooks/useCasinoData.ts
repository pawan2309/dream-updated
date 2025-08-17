import { useState, useEffect, useCallback } from 'react';
import { GAME_CONFIG, ERROR_MESSAGES, LOADING_STATES } from '../config/gameConfig';

export interface CasinoData {
  gameName: string;
  gameType: string;
  streamingId: string;
  isActive: boolean;
  currentRound: {
    id: string;
    status: 'waiting' | 'betting' | 'active' | 'finished';
    timeLeft: number;
    totalBets: number;
    playerABets: number;
    playerBBets: number;
  };
  statistics: {
    totalRounds: number;
    playerAWins: number;
    playerBWins: number;
    averageBet: number;
  };
  settings: {
    minBet: number;
    maxBet: number;
    maxExposure: number;
  };
}

interface UseCasinoDataReturn {
  data: CasinoData | null;
  loading: string;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCasinoData = (streamingId: string): UseCasinoDataReturn => {
  const [data, setData] = useState<CasinoData | null>(null);
  const [loading, setLoading] = useState<string>(LOADING_STATES.INITIAL);
  const [error, setError] = useState<string | null>(null);

  const fetchCasinoData = useCallback(async () => {
    if (!streamingId) return;

    try {
      setLoading(LOADING_STATES.LOADING);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_ERROR);
        setLoading(LOADING_STATES.ERROR);
        return;
      }

      const response = await fetch(`${GAME_CONFIG.API_ENDPOINTS.CASINO_DATA}/${streamingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        setLoading(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(result.message || 'Failed to fetch casino data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC_ERROR;
      setError(errorMessage);
      setLoading(LOADING_STATES.ERROR);
      console.error('Error fetching casino data:', err);
    }
  }, [streamingId]);

  const refetch = useCallback(async () => {
    await fetchCasinoData();
  }, [fetchCasinoData]);

  useEffect(() => {
    fetchCasinoData();
  }, [fetchCasinoData]);

  return { data, loading, error, refetch };
};
