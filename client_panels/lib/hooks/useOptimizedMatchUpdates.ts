import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketService } from '../websocketService';

export interface OptimizedMatchUpdate {
  matchId: string;
  type: 'odds' | 'fancy' | 'score' | 'status' | 'market';
  data: any;
  timestamp: number;
}

export interface UseOptimizedMatchUpdatesOptions {
  matchId: string;
  onOddsUpdate?: (data: any) => void;
  onFancyUpdate?: (data: any) => void;
  onScoreUpdate?: (data: any) => void;
  onStatusUpdate?: (data: any) => void;
  onMarketUpdate?: (data: any) => void;
  enableVisualFeedback?: boolean;
}

export function useOptimizedMatchUpdates({
  matchId,
  onOddsUpdate,
  onFancyUpdate,
  onScoreUpdate,
  onStatusUpdate,
  onMarketUpdate,
  enableVisualFeedback = true
}: UseOptimizedMatchUpdatesOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Refs to track update state
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Date | null>(null);

  // Optimized update handler with debouncing
  const handleUpdate = useCallback((type: string, data: any) => {
    if (!enableVisualFeedback) return;

    // Set updating state for visual feedback
    setIsUpdating(true);
    setUpdateCount(prev => prev + 1);
    setLastUpdate(new Date());

    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Reset updating state after a short delay
    updateTimeoutRef.current = setTimeout(() => {
      setIsUpdating(false);
    }, 1000);

    // Call the appropriate callback
    switch (type) {
      case 'odds':
        onOddsUpdate?.(data);
        break;
      case 'fancy':
        onFancyUpdate?.(data);
        break;
      case 'score':
        onScoreUpdate?.(data);
        break;
      case 'status':
        onStatusUpdate?.(data);
        break;
      case 'market':
        onMarketUpdate?.(data);
        break;
    }
  }, [onOddsUpdate, onFancyUpdate, onScoreUpdate, onStatusUpdate, onMarketUpdate, enableVisualFeedback]);

  // Subscribe to websocket updates
  useEffect(() => {
    if (!matchId) return;

    console.log(`🔌 [OPTIMIZED-UPDATES] Setting up optimized updates for match: ${matchId}`);

    // Subscribe to optimized match updates
    const unsubscribe = websocketService.subscribeToMatchUpdates(matchId, {
      onOddsUpdate: (data) => handleUpdate('odds', data),
      onFancyUpdate: (data) => handleUpdate('fancy', data),
      onScoreUpdate: (data) => handleUpdate('score', data),
      onStatusUpdate: (data) => handleUpdate('status', data),
      onMarketUpdate: (data) => handleUpdate('market', data)
    });

    // Monitor connection status
    const connectionListener = websocketService.subscribe('connected', () => {
      setIsConnected(true);
    });

    const disconnectionListener = websocketService.subscribe('disconnected', () => {
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      unsubscribe();
      // Note: websocketService doesn't have unsubscribe method, using cleanup function instead
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [matchId, handleUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to get update indicator styles
  const getUpdateIndicatorStyles = useCallback(() => {
    if (!isUpdating) return {};
    
    return {
      animation: 'pulse 1s ease-in-out',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '4px',
      transition: 'all 0.3s ease'
    };
  }, [isUpdating]);

  // Helper function to get last update text
  const getLastUpdateText = useCallback(() => {
    if (!lastUpdate) return 'No updates yet';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `Updated ${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `Updated ${Math.floor(diffSeconds / 60)}m ago`;
    return `Updated ${Math.floor(diffSeconds / 3600)}h ago`;
  }, [lastUpdate]);

  return {
    isConnected,
    isUpdating,
    lastUpdate,
    updateCount,
    getUpdateIndicatorStyles,
    getLastUpdateText,
    // Force refresh function (for manual refresh if needed)
    forceRefresh: useCallback(() => {
      setUpdateCount(prev => prev + 1);
      setLastUpdate(new Date());
    }, [])
  };
}
