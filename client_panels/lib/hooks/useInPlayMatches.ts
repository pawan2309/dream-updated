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

  // Helper function to determine match status from fixture data (same as match page)
  const getMatchStatus = (fixture: any): string => {
    // First priority: if match is live (iplay = true), show INPLAY
    if (fixture.iplay === true) {
      return 'INPLAY';
    }
    
    // Parse the start time properly
    let startTime: Date | null = null;
    if (fixture.stime) {
      try {
        // Handle different date formats from API
        if (typeof fixture.stime === 'string') {
          // Try parsing as is first
          startTime = new Date(fixture.stime);
          
          // If invalid, try parsing with different formats
          if (isNaN(startTime.getTime())) {
            // Try parsing as MM/DD/YYYY HH:MM:SS AM/PM format
            const parts = fixture.stime.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)\s+(AM|PM)/);
            if (parts) {
              const [_, month, day, year, hour, minute, second, ampm] = parts;
              let hour24 = parseInt(hour);
              if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
              if (ampm === 'AM' && hour24 === 12) hour24 = 0;
              startTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(hour24), parseInt(minute), parseInt(second));
            }
          }
        }
      } catch (error) {
        console.error('Error parsing fixture start time:', error);
        startTime = null;
      }
    }
    
    if (!startTime || isNaN(startTime.getTime())) {
      return 'UPCOMING';
    }
    
    const now = new Date();
    
    // If start time is in the future, match is upcoming
    if (startTime > now) {
      return 'UPCOMING';
    }
    
    // If start time is in the past but within last 24 hours
    if (startTime <= now && startTime > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
      // Check if match is still live or finished
      return fixture.iplay === true ? 'INPLAY' : 'FINISHED';
    }
    
    // If start time is more than 24 hours ago, match is finished
    return 'FINISHED';
  };

  // Fetch initial matches
  const fetchInitialMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real fixture data from the API (same as match page)
      const response = await fetch(`http://localhost:4001/provider/cricketmatches`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const fixturesData = await response.json();
      
      // Transform the API data to match our interface
      const enhancedMatches: InPlayMatch[] = fixturesData.map((fixture: any) => {
        // Debug: Log the status processing
        console.log('🔍 Hook Status Processing:', {
          id: fixture.beventId,
          ename: fixture.ename,
          iplay: fixture.iplay,
          stime: fixture.stime,
          status: fixture.status
        });
        
        // Use the improved status determination logic
        const determinedStatus = getMatchStatus(fixture);
        console.log('🔍 Determined Status:', determinedStatus);
        
        return {
          id: fixture.beventId || fixture.id,
          matchId: fixture.beventId || fixture.id,
          matchName: fixture.ename || 'Unknown Match',
          tournament: fixture.cname || 'Unknown Tournament',
          date: fixture.stime ? new Date(fixture.stime).toLocaleDateString() : '',
          time: fixture.stime ? new Date(fixture.stime).toLocaleTimeString() : '',
          venue: '',
          sport: 'Cricket',
          isLive: fixture.iplay || false,
          matchStatus: determinedStatus as InPlayMatch['matchStatus'],
          lastUpdate: Date.now()
        };
      });
      
      setMatches(enhancedMatches);
      matchesRef.current = enhancedMatches;
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
        // Use the improved status determination logic
        const determinedStatus = getMatchStatus(match);
        
        return {
          ...match,
          matchStatus: determinedStatus as InPlayMatch['matchStatus'],
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
