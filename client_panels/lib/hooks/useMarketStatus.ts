import { useState, useEffect, useCallback } from 'react';
import { websocketService } from '../websocketService';

export interface MarketStatus {
  matchId: string;
  marketId: string;
  matchStatus: 'UPCOMING' | 'LIVE' | 'SUSPENDED' | 'CLOSED' | 'COMPLETED' | 'ABANDONED' | 'SETTLED';
  marketStatus: 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'SETTLED';
  isActive: boolean;
  lastUpdated: string;
  selections: any[];
  suspensionReason?: string;
  suspendedAt?: string;
}

export interface MarketStatusResponse {
  success: boolean;
  data?: MarketStatus;
  error?: string;
}

export function useMarketStatus(matchId: string, marketId: string) {
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

  // Fetch market status from API
  const fetchMarketStatus = useCallback(async () => {
    if (!matchId || !marketId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${baseUrl}/api/market/status/${matchId}/${marketId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MarketStatusResponse = await response.json();
      
      if (data.success && data.data) {
        setMarketStatus(data.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch market status');
      }
    } catch (err) {
      console.error('Error fetching market status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market status');
    } finally {
      setLoading(false);
    }
  }, [matchId, marketId, baseUrl]);

  // Subscribe to real-time market updates via WebSocket
  useEffect(() => {
    if (!matchId || !marketId) return;

    // Subscribe to market status updates
    const unsubscribeMarket = websocketService.subscribe('market_update', (update) => {
      if (update.matchId === matchId && update.marketId === marketId) {
        console.log('🔄 [WEBSOCKET] Market status update received:', update);
        
        if (update.data) {
          setMarketStatus(update.data);
          setLastUpdate(new Date());
        }
      }
    });

    // Subscribe to match updates
    const unsubscribeMatch = websocketService.subscribe('match_update', (update) => {
      if (update.matchId === matchId) {
        console.log('🔄 [WEBSOCKET] Match update received for market status:', update);
        
        // Refresh market status when match status changes
        fetchMarketStatus();
      }
    });

    // Subscribe to the specific match
    websocketService.subscribeToMatch(matchId);

    // Initial fetch
    fetchMarketStatus();

    // Cleanup function
    return () => {
      unsubscribeMarket();
      unsubscribeMatch();
      websocketService.unsubscribeFromMatch(matchId);
    };
  }, [matchId, marketId, fetchMarketStatus]);

  // Helper functions
  const isMarketSuspended = useCallback(() => {
    return marketStatus?.marketStatus === 'SUSPENDED' || marketStatus?.matchStatus === 'SUSPENDED';
  }, [marketStatus]);

  const isMarketClosed = useCallback(() => {
    return marketStatus?.marketStatus === 'CLOSED' || marketStatus?.matchStatus === 'CLOSED';
  }, [marketStatus]);

  const canAcceptBets = useCallback(() => {
    return marketStatus?.isActive === true;
  }, [marketStatus]);

  const getSuspensionReason = useCallback(() => {
    if (marketStatus?.suspensionReason) {
      return marketStatus.suspensionReason;
    }
    
    if (marketStatus?.matchStatus === 'SUSPENDED') {
      return 'Match is suspended';
    }
    
    if (marketStatus?.marketStatus === 'SUSPENDED') {
      return 'Market is suspended';
    }
    
    return 'Betting is not available';
  }, [marketStatus]);

  const getStatusColor = useCallback(() => {
    if (isMarketSuspended()) return 'text-yellow-600';
    if (isMarketClosed()) return 'text-red-600';
    if (canAcceptBets()) return 'text-green-600';
    return 'text-gray-600';
  }, [isMarketSuspended, isMarketClosed, canAcceptBets]);

  const getStatusText = useCallback(() => {
    if (isMarketSuspended()) return 'SUSPENDED';
    if (isMarketClosed()) return 'CLOSED';
    if (canAcceptBets()) return 'OPEN';
    return 'UNAVAILABLE';
  }, [isMarketSuspended, isMarketClosed, canAcceptBets]);

  return {
    marketStatus,
    loading,
    error,
    lastUpdate,
    isMarketSuspended,
    isMarketClosed,
    canAcceptBets,
    getSuspensionReason,
    getStatusColor,
    getStatusText,
    refresh: fetchMarketStatus,
  };
}
