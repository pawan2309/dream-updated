import { useState, useEffect, useCallback, useRef } from 'react';
import { Match } from '../sharedApi';
import { websocketService, LiveMatchUpdate } from '../websocketService';
import { sharedApiService } from '../sharedApi';

export interface InPlayMatch extends Match {
  liveScore?: {
    homeScore: string;
    awayScore: string;
    overs: string;
    runRate: string;
    requiredRunRate?: string;
  };
  liveOdds?: {
    home: number;
    away: number;
    draw?: number;
    lastUpdated: number;
  };
  matchStatus: 'LIVE' | 'BREAK' | 'INTERVAL' | 'FINISHED' | 'UPCOMING' | 'SCHEDULED' | 'POSTPONED' | 'CANCELLED' | 'INPLAY' | 'OPEN';
  lastUpdate: number;
}

export interface MatchFilters {
  sport?: string;
  tournament?: string;
  searchQuery?: string;
  showOnlyLive?: boolean;
}

export function useInPlayMatches() {
  const [matches, setMatches] = useState<InPlayMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<InPlayMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchFilters>({
    showOnlyLive: false
  });
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  const matchesRef = useRef<InPlayMatch[]>([]);
  const filtersRef = useRef<MatchFilters>(filters);

  // Update refs when state changes
  useEffect(() => {
    matchesRef.current = matches;
    filtersRef.current = filters;
  }, [matches, filters]);

  // Apply filters to matches
  const applyFilters = useCallback((matchesToFilter: InPlayMatch[], currentFilters: MatchFilters) => {
    let filtered = matchesToFilter;

    // Filter by sport
    if (currentFilters.sport) {
      filtered = filtered.filter(match => match.sport === currentFilters.sport);
    }

    // Filter by tournament
    if (currentFilters.tournament) {
      filtered = filtered.filter(match => match.tournament === currentFilters.tournament);
    }

    // Filter by search query
    if (currentFilters.searchQuery) {
      const query = currentFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(match => 
        match.matchName.toLowerCase().includes(query) ||
        match.tournament.toLowerCase().includes(query) ||
        (match.matchId || match.id).toLowerCase().includes(query)
      );
    }

    // Filter by live status
    if (currentFilters.showOnlyLive) {
      filtered = filtered.filter(match => match.isLive);
    }

    return filtered;
  }, []);

  // Update filtered matches when matches or filters change
  useEffect(() => {
    const filtered = applyFilters(matches, filters);
    setFilteredMatches(filtered);
  }, [matches, filters, applyFilters]);

  // Fetch initial matches
  const fetchInitialMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await sharedApiService.getMatches();
      
      if (result.success && result.data) {
        const enhancedMatches: InPlayMatch[] = result.data.map(match => {
          // Debug: Log the status processing
          console.log('🔍 Hook Status Processing:', {
            id: match.id,
            originalStatus: match.status,
            isLive: match.isLive,
            finalStatus: match.status || (match.isLive ? 'LIVE' : 'UPCOMING')
          });
          
          // Map status correctly - handle 'OPEN' from backend
          let mappedStatus = match.status || (match.isLive ? 'LIVE' : 'UPCOMING');
          if (mappedStatus === 'OPEN') {
            mappedStatus = 'UPCOMING';
          }
          
          return {
            ...match,
            matchStatus: mappedStatus as InPlayMatch['matchStatus'],
            lastUpdate: Date.now()
          };
        });
        
        setMatches(enhancedMatches);
        matchesRef.current = enhancedMatches;
      } else {
        setError(result.error || 'Failed to load in-play matches');
      }
    } catch (err) {
      console.error('Error fetching in-play matches:', err);
      setError('Failed to load in-play matches. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle WebSocket updates
  const handleWebSocketUpdates = useCallback(() => {
    // Subscribe to in-play matches updates
    const unsubscribeInPlay = websocketService.subscribe('inplay_matches', (data: InPlayMatch[]) => {
      const enhancedMatches: InPlayMatch[] = data.map(match => {
        // Map status correctly - handle 'OPEN' from backend
        let mappedStatus = match.status || (match.isLive ? 'LIVE' : 'UPCOMING');
        if (mappedStatus === 'OPEN') {
          mappedStatus = 'UPCOMING';
        }
        
        return {
          ...match,
          matchStatus: mappedStatus as InPlayMatch['matchStatus'],
          lastUpdate: Date.now()
        };
      });
      
      setMatches(enhancedMatches);
      matchesRef.current = enhancedMatches;
      setLastUpdate(Date.now());
    });

    // Subscribe to individual match updates
    const unsubscribeMatchUpdate = websocketService.subscribe('match_update', (update: LiveMatchUpdate) => {
      setMatches(prevMatches => {
        const updatedMatches = prevMatches.map(match => {
          if (match.id === update.matchId) {
            return {
              ...match,
              ...update.data,
              lastUpdate: update.timestamp
            };
          }
          return match;
        });
        
        matchesRef.current = updatedMatches;
        return updatedMatches;
      });
      setLastUpdate(update.timestamp);
    });

    // Subscribe to score updates
    const unsubscribeScoreUpdate = websocketService.subscribe('score_update', (update: LiveMatchUpdate) => {
      setMatches(prevMatches => {
        const updatedMatches = prevMatches.map(match => {
          if (match.id === update.matchId) {
            return {
              ...match,
              liveScore: update.data.liveScore,
              lastUpdate: update.timestamp
            };
          }
          return match;
        });
        
        matchesRef.current = updatedMatches;
        return updatedMatches;
      });
      setLastUpdate(update.timestamp);
    });

    // Subscribe to odds updates
    const unsubscribeOddsUpdate = websocketService.subscribe('odds_update', (update: LiveMatchUpdate) => {
      setMatches(prevMatches => {
        const updatedMatches = prevMatches.map(match => {
          if (match.id === update.matchId) {
            return {
              ...match,
              liveOdds: update.data.liveOdds,
              lastUpdate: update.timestamp
            };
          }
          return match;
        });
        
        matchesRef.current = updatedMatches;
        return updatedMatches;
      });
      setLastUpdate(update.timestamp);
    });

    // Subscribe to connection status
    const unsubscribeConnected = websocketService.subscribe('connected', () => {
      setConnectionStatus(true);
      // Request in-play matches when connected
      websocketService.requestInPlayMatches();
    });

    const unsubscribeDisconnected = websocketService.subscribe('disconnected', () => {
      setConnectionStatus(false);
    });

    // Return cleanup function
    return () => {
      unsubscribeInPlay();
      unsubscribeMatchUpdate();
      unsubscribeScoreUpdate();
      unsubscribeOddsUpdate();
      unsubscribeConnected();
      unsubscribeDisconnected();
    };
  }, []);

  // Initialize
  useEffect(() => {
    fetchInitialMatches();
    
    // Authenticate and setup WebSocket
    const setupWebSocket = async () => {
      try {
        const authSuccess = await websocketService.authenticate();
        if (authSuccess) {
          const cleanup = handleWebSocketUpdates();
          return cleanup;
        } else {
          console.error('❌ WebSocket authentication failed');
        }
      } catch (error) {
        console.error('❌ WebSocket setup error:', error);
      }
    };
    
    setupWebSocket();
  }, [fetchInitialMatches, handleWebSocketUpdates]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MatchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Refresh matches
  const refreshMatches = useCallback(() => {
    if (connectionStatus) {
      websocketService.requestInPlayMatches();
    } else {
      fetchInitialMatches();
    }
  }, [connectionStatus, fetchInitialMatches]);

  // Subscribe to specific match updates
  const subscribeToMatch = useCallback((matchId: string) => {
    websocketService.subscribeToMatch(matchId);
  }, []);

  // Unsubscribe from specific match updates
  const unsubscribeFromMatch = useCallback((matchId: string) => {
    websocketService.unsubscribeFromMatch(matchId);
  }, []);

  // Get available sports for filtering
  const availableSports = [...new Set(matches.map(match => match.sport).filter(Boolean))] as string[];
  
  // Get available tournaments for filtering
  const availableTournaments = [...new Set(matches.map(match => match.tournament).filter(Boolean))] as string[];

  return {
    matches: filteredMatches,
    allMatches: matches,
    loading,
    error,
    filters,
    connectionStatus,
    lastUpdate,
    availableSports,
    availableTournaments,
    updateFilters,
    refreshMatches,
    subscribeToMatch,
    unsubscribeFromMatch,
    setFilters
  };
}
