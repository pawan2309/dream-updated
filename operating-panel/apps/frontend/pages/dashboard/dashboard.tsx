import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../layout";
import { Button } from "../../src/components/Button";
import { DecisionModal } from "../../src/components/DecisionModal";
import { Toast } from "../../src/components/Toast";
import { useUser } from "../../lib/hooks/useUser";
import { apiFetch, buildApiUrl } from "../../lib/apiClient";

interface Match {
  id: string;
  matchId: string;
  bmarketId?: string; // Add bmarketId field
  beventId?: string; // Add beventId field
  matchName: string;
  tournament: string;
  date: string;
  time: string;
  dateObj: Date; // Add the Date object for filtering
  sport: string;
  status: string;
  externalId: string;
  gameId: string;
  title: string;
  isLive: boolean;
  section?: any[];
}

export default function Dashboard() {
  const { user, loading: userLoading, isAdmin, isOwner } = useUser();
  const router = useRouter();
  
  // All useState hooks must be called before any conditional returns to avoid React hooks error
  const [selectedMatchType, setSelectedMatchType] = useState("INPLAY");
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({ message: '', type: 'info', isVisible: false });

  // Filter matches based on selected match type
  const filterMatches = (matches: Match[], matchType: string): Match[] => {
    const currentTime = new Date();
    console.log('🔍 Filtering matches:', matches.length, 'for type:', matchType, 'current time:', currentTime);
    
    switch (matchType) {
      case "INPLAY":
        const inplayMatches = matches.filter(match => {
          // Only show matches that are explicitly marked as live
          if (match.isLive === true) return true;
          
          // Check if match status indicates it's live
          const status = match.status?.toLowerCase() || '';
          if (status.includes('live') || status.includes('inplay') || status.includes('in_play')) return true;
          
          // Check if match has started and is within a reasonable live window (not upcoming)
          const matchDateTime = match.dateObj || new Date();
          const timeDiff = matchDateTime.getTime() - currentTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // Only show matches that have started (not upcoming) and are within 8 hours of start
          const hasStarted = matchDateTime <= currentTime;
          const isWithinLiveWindow = hasStarted && hoursDiff >= -8 && hoursDiff <= 0;
          
          // Additional safety check: if match has future date, it cannot be live
          const hasFutureDate = matchDateTime > currentTime;
          if (hasFutureDate) return false;
          
          const result = isWithinLiveWindow;
          console.log('🔍 INPLAY filter:', match.matchName, 'dateObj:', match.dateObj, 'hasStarted:', hasStarted, 'hoursDiff:', hoursDiff, 'hasFutureDate:', hasFutureDate, 'result:', result);
          return result;
        });
        console.log('🔍 INPLAY matches found:', inplayMatches.length);
        return inplayMatches;
      case "UPCOMING":
        const upcomingMatches = matches.filter(match => {
          const matchDateTime = match.dateObj || new Date();
          const timeDiff = matchDateTime.getTime() - currentTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // Only show matches that haven't started yet (future matches)
          const result = matchDateTime > currentTime;
          console.log('🔍 UPCOMING filter:', match.matchName, 'dateObj:', match.dateObj, 'hoursDiff:', hoursDiff, 'result:', result);
          return result;
        });
        console.log('🔍 UPCOMING matches found:', upcomingMatches.length);
        return upcomingMatches;
      case "COMPLETED":
        const completedMatches = matches.filter(match => {
          const matchDateTime = match.dateObj || new Date();
          const timeDiff = matchDateTime.getTime() - currentTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          const result = hoursDiff < -8;
          console.log('🔍 COMPLETED filter:', match.matchName, 'dateObj:', match.dateObj, 'result:', result);
          return result;
        });
        console.log('🔍 COMPLETED matches found:', completedMatches.length);
        return completedMatches;
      case "ABANDONED":
        const abandonedMatches = matches.filter(match => {
          // Filter matches that are abandoned or canceled
          const status = match.status?.toLowerCase() || '';
          const result = status.includes('abandoned') || status.includes('canceled') || status.includes('cancelled');
          console.log('🔍 ABANDONED filter:', match.matchName, 'status:', match.status, 'result:', result);
          return result;
        });
        console.log('🔍 ABANDONED matches found:', abandonedMatches.length);
        return abandonedMatches;
      case "REMOVE":
        // For REMOVE filter, show matches that should be removed (e.g., old completed matches)
        const removeMatches = matches.filter(match => {
          const matchDateTime = match.dateObj || new Date();
          const timeDiff = matchDateTime.getTime() - currentTime.getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          const result = daysDiff < -30; // Matches older than 30 days
          console.log('🔍 REMOVE filter:', match.matchName, 'daysDiff:', daysDiff, 'result:', result);
          return result;
        });
        console.log('🔍 REMOVE matches found:', removeMatches.length);
        return removeMatches;
      case "CANCEL":
        // For CANCEL filter, show matches that are canceled
        const cancelMatches = matches.filter(match => {
          const status = match.status?.toLowerCase() || '';
          const result = status.includes('cancel') || status.includes('cancelled');
          console.log('🔍 CANCEL filter:', match.matchName, 'status:', match.status, 'result:', result);
          return result;
        });
        console.log('🔍 CANCEL matches found:', cancelMatches.length);
        return cancelMatches;
      default:
        return matches;
    }
  };

  function toDateParts(rawDate: string | number | Date | undefined) {
    if (!rawDate) {
      return { 
        date: 'Unknown', 
        time: 'Unknown',
        dateObj: new Date() 
      };
    }
    const d = new Date(rawDate);
    return { 
      date: d.toLocaleDateString(), 
      time: d.toLocaleTimeString(),
      dateObj: d 
    };
  }

  function normalizeRawMatch(raw: any): Match | null {
    try {
      // Handle the normalized data structure from backend
      // Backend now prioritizes bmarketId over beventId
      // Use the backend-provided IDs directly - they should now be different
      const beventId = raw?.beventId || raw?.eventId || (raw?.event && raw.event.id) || null;
      const bmarketId = raw?.bmarketId || raw?.marketId || raw?.bettingMarketId || null;
      
      // Primary ID should be beventId, fallback to other options
      const id = beventId || raw?.id || raw?.eventId || raw?.matchId || raw?._id;
      if (!id) return null;
      
      // Debug: Log what we received from backend
      console.log('🔍 Backend data received:', {
        rawId: raw?.id,
        beventId: raw?.beventId,
        bmarketId: raw?.bmarketId,
        finalId: id
      });

      // Extract name from various possible fields
      let name = raw?.name ?? raw?.matchName ?? raw?.ename ?? '';
      
      // If no direct name, try to construct from teams
      if (!name && raw?.teams && Array.isArray(raw?.teams) && raw?.teams.length >= 2) {
        name = `${raw.teams[0]?.name || 'Team 1'} vs ${raw.teams[1]?.name || 'Team 2'}`;
      }
      
      // Fallback to team construction if still no name
      if (!name) {
        name = `${raw?.team1 ?? raw?.teamA ?? 'Team 1'} vs ${raw?.team2 ?? raw?.teamB ?? 'Team 2'}`;
      }

      const tournament = raw?.tournament ?? raw?.series ?? raw?.league ?? raw?.cname ?? 'Cricket';
      
      // Handle status - check if it's a string or needs conversion
      let status = raw?.status;
      if (typeof status === 'string') {
        // Normalize status values to match our filter categories
        const statusLower = status.toLowerCase();
        if (statusLower === 'open' || statusLower === 'scheduled') {
          status = 'Upcoming';
        } else if (statusLower === 'live' || statusLower === 'inplay' || statusLower === 'in_play') {
          status = 'Live';
        } else if (statusLower === 'completed' || statusLower === 'finished' || statusLower === 'resulted') {
          status = 'Completed';
        } else if (statusLower === 'abandoned' || statusLower === 'canceled' || statusLower === 'cancelled') {
          status = 'Abandoned';
        } else {
          status = status; // Keep original status if it doesn't match known patterns
        }
      } else {
        status = raw?.inPlay ? 'Live' : 'Upcoming';
      }
      
      // Handle start time from various fields
      const startTime = raw?.startTime ?? raw?.start_time ?? raw?.startDate ?? raw?.stime ?? raw?.edate;
      console.log('🔍 Raw startTime:', startTime, 'Type:', typeof startTime);
      const { date, time, dateObj } = toDateParts(startTime);
      console.log('🔍 Parsed date:', date, 'time:', time, 'dateObj:', dateObj);
      
      // Determine if match is live - ONLY if it's actually started and active
      const isLive = Boolean(
        raw?.inPlay || 
        raw?.isLive || 
        raw?.status === 'LIVE' ||
        status?.toLowerCase() === 'live' ||
        status?.toLowerCase() === 'inplay' ||
        status?.toLowerCase() === 'in_play'
      );
      
      // Additional check: if match has a future date, it cannot be live
      const hasFutureDate = dateObj > new Date();
      const finalIsLive = isLive && !hasFutureDate;

      return {
        id,
        matchId: id,
        bmarketId: bmarketId || raw?.marketId || raw?.bmId || undefined,
        beventId: beventId || raw?.eventId || raw?.id || undefined,
        matchName: name || 'Match',
        tournament,
        date,
        time,
        dateObj, // Store the actual Date object for filtering
        sport: 'Cricket',
        status,
        externalId: beventId || raw?.eventId || raw?.id || id, // Primary ID (beventid)
        gameId: id,
        title: name || 'Match',
        isLive: finalIsLive
      };
    } catch (error) {
      console.error('🔍 Error normalizing match:', error, 'Raw data:', raw);
      return null;
    }
  }

  // Load real matches from local backend with fallback strategy
  const loadRealMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading cricket matches with fallback strategy');
      
      // Strategy 1: Try Redis endpoint first (for In-Play matches)
      let redisData = null;
      try {
        const redisResponse = await fetch('/api/cricketmatches?source=redis', {
          headers: { 'Accept': 'application/json' }
        });
        if (redisResponse.ok) {
          redisData = await redisResponse.json();
          console.log('✅ Redis data loaded:', redisData?.length || 0, 'matches');
        }
      } catch (redisError) {
        console.log('⚠️ Redis endpoint failed, trying database fallback');
      }
      
      // Strategy 2: Try database endpoint as fallback
      let dbData = null;
      try {
        const dbResponse = await fetch('/api/cricketmatches?source=database', {
          headers: { 'Accept': 'application/json' }
        });
        if (dbResponse.ok) {
          dbData = await dbResponse.json();
          console.log('✅ Database data loaded:', dbData?.length || 0, 'matches');
        }
      } catch (dbError) {
        console.log('⚠️ Database endpoint failed, trying default endpoint');
      }
      
      // Strategy 3: Try default endpoint as final fallback
      let defaultData = null;
      try {
        const defaultResponse = await fetch('/api/cricketmatches', {
          headers: { 'Accept': 'application/json' }
        });
        if (defaultResponse.ok) {
          defaultData = await defaultResponse.json();
          console.log('✅ Default endpoint data loaded:', defaultData?.length || 0, 'matches');
        }
      } catch (defaultError) {
        console.log('⚠️ Default endpoint failed');
      }
      
      // Combine data with priority: Redis (live) + Database (persistent)
      let combinedData = [];
      let hasRedisData = false;
      
      if (redisData && Array.isArray(redisData) && redisData.length > 0) {
        // Add Redis data (live matches) - highest priority
        combinedData.push(...redisData.map(match => ({ ...match, source: 'redis' })));
        hasRedisData = true;
        console.log('✅ Redis has live data:', redisData.length, 'matches');
      } else {
        console.log('⚠️ Redis has no live data, using database fallback');
      }
      
      if (dbData && Array.isArray(dbData)) {
        // Add database data (persistent: upcoming, completed, abandoned)
        const existingIds = new Set(combinedData.map(m => m.id));
        const newDbMatches = dbData.filter(match => !existingIds.has(match.id));
        combinedData.push(...newDbMatches.map(match => ({ ...match, source: 'database' })));
        console.log('✅ Added Database data:', newDbMatches.length, 'persistent matches');
      }
      
      // If we just got Redis data and user is viewing In-Play, refresh to show live data
      if (hasRedisData && selectedMatchType === 'INPLAY') {
        console.log('🔄 Redis now has live data, refreshing to show live matches');
        // The data will be automatically filtered and displayed
      }
      
      if (defaultData && Array.isArray(defaultData) && combinedData.length === 0) {
        // Use default data only if no other source worked
        combinedData = defaultData.map(match => ({ ...match, source: 'default' }));
        console.log('⚠️ Using default endpoint data as fallback');
      }
      
      if (combinedData.length === 0) {
        throw new Error('No data available from any source');
      }
      
      console.log('🔍 Combined data:', combinedData.length, 'matches');
      console.log('🔍 Data sources:', [...new Set(combinedData.map(m => m.source))]);
      
      // Normalize and process the combined data
      const normalized: Match[] = [];
      for (const raw of combinedData) {
        const m = normalizeRawMatch(raw);
        if (m) normalized.push(m);
      }
      
      console.log('✅ Normalized matches:', normalized.length);
      
      // Set the data
      setAllMatches(normalized);
      
      // Filter based on selected type
      const filtered = filterMatches(normalized, selectedMatchType);
      setMatches(filtered);
      
      console.log('✅ Dashboard updated with', normalized.length, 'total matches,', filtered.length, 'filtered');
      
    } catch (err: any) {
      console.error('❌ Failed to load matches from all sources:', err);
      setError(err?.message || 'Failed to load cricket matches from all sources');
      setAllMatches([]);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch matches when component mounts or match type changes
  useEffect(() => {
    loadRealMatches();
  }, [selectedMatchType]);

  // WebSocket state and connection
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastSocketUpdate, setLastSocketUpdate] = useState<Date | null>(null);

  // Initialize WebSocket connection for live updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connectWebSocket = () => {
      try {
        // Connect to WebSocket endpoint for live cricket updates
        const wsUrl = process.env.NODE_ENV === 'production' 
          ? 'wss://your-domain.com/ws/cricket-live'
          : 'ws://localhost:4001/ws/cricket-live';
        
        console.log('🔌 Connecting to WebSocket:', wsUrl);
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setSocketConnected(true);
          setSocket(ws);
          
          // Subscribe to live match updates
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'subscribe',
              filter: 'live-matches',
              userId: user?.id
            }));
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📡 WebSocket message received:', data);
            
            if (data.type === 'live-match-update') {
              // Update live match data in real-time
              handleLiveMatchUpdate(data.payload);
              setLastSocketUpdate(new Date());
            } else if (data.type === 'match-status-change') {
              // Handle match status changes (start, finish, etc.)
              handleMatchStatusChange(data.payload);
              setLastSocketUpdate(new Date());
            }
          } catch (error) {
            console.error('❌ WebSocket message parse error:', error);
          }
        };
        
        ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          setSocketConnected(false);
          setSocket(null);
          
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (!socketConnected) {
              console.log('🔄 Attempting WebSocket reconnection...');
              connectWebSocket();
            }
          }, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setSocketConnected(false);
        };
        
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        setSocketConnected(false);
      }
    };
    
    // Only connect if user is authenticated and we're viewing live matches
    if (user && selectedMatchType === 'INPLAY') {
      connectWebSocket();
    }
    
    return () => {
      if (ws) {
        console.log('🔌 Closing WebSocket connection');
        ws.close();
      }
    };
  }, [user, selectedMatchType]);

  // Smart refresh strategy: WebSocket for live, polling as backup
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (selectedMatchType === 'INPLAY' && socketConnected) {
      // If WebSocket is connected for live matches, use longer polling as backup
      refreshInterval = setInterval(() => {
        console.log('🔄 Backup refresh triggered (WebSocket active)');
        loadRealMatches();
      }, 60000); // 1 minute backup refresh
    } else {
      // For non-live matches or when WebSocket is down, use regular polling
      refreshInterval = setInterval(() => {
        console.log('🔄 Regular refresh triggered');
        loadRealMatches();
      }, 30000); // 30 seconds for non-live matches
    }
    
    return () => clearInterval(refreshInterval);
  }, [selectedMatchType, socketConnected]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  // Handle match selection
  const handleMatchSelection = (matchId: string, checked: boolean) => {
    if (checked) {
      setSelectedMatches(prev => [...prev, matchId]);
    } else {
      setSelectedMatches(prev => prev.filter(id => id !== matchId));
    }
  };

  // Handle select all matches
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMatches(matches.map(match => match.id));
    } else {
      setSelectedMatches([]);
    }
  };

  // Handle action buttons
  const handleAction = (action: string, matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    switch (action) {
      case 'match':
        setSelectedMatch(match);
        setDecisionModalOpen(true);
        break;
      case 'fancy':
        router.push(`/dashboard/fancy-decision?matchId=${matchId}`);
        break;
      case 'toss':
        router.push(`/dashboard/toss-decision?matchId=${matchId}`);
        break;
      case 'refresh':
        loadRealMatches();
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Get match count by type
  const getMatchCount = (type: string) => {
    if (type === 'Cricket') return allMatches.length;
    return allMatches.filter(match => match.sport === type).length;
  };

  // Get match count by filter type
  const getFilterCount = (filterType: string) => {
    return filterMatches(allMatches, filterType).length;
  };

  console.log('🔍 Render - matches length:', matches.length);
  console.log('🔍 Render - selectedMatchType:', selectedMatchType);
  console.log('🔍 Render - first match sample:', matches[0]);
  console.log('🔍 Render - all matches details:', matches.map(m => ({
    name: m.matchName,
    date: m.date,
    time: m.time,
    isLive: m.isLive,
    status: m.status,
    dateObj: m.dateObj
  })));

  // Show loading state while user data is loading
  if (userLoading) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          Loading user data...
        </div>
      </Layout>
    );
  }

  // Show unauthorized message if user is not admin or owner
  if (!isAdmin && !isOwner) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#dc2626'
        }}>
          Access denied. Admin or Owner privileges required.
        </div>
      </Layout>
    );
  }

  // Handle live match updates from WebSocket
  const handleLiveMatchUpdate = (updateData: any) => {
    try {
      console.log('🔄 Processing live match update:', updateData);
      
      setAllMatches(prevMatches => {
        const updatedMatches = prevMatches.map(match => {
          if (match.id === updateData.matchId || match.externalId === updateData.matchId) {
            // Update live match data
            return {
              ...match,
              ...updateData.updates,
              lastUpdate: new Date(),
              source: 'websocket'
            };
          }
          return match;
        });
        
        console.log('✅ Live matches updated via WebSocket');
        return updatedMatches;
      });
      
      // Also update filtered matches if we're viewing live matches
      if (selectedMatchType === 'INPLAY') {
        setMatches(prevMatches => {
          const updatedMatches = prevMatches.map(match => {
            if (match.id === updateData.matchId || match.externalId === updateData.matchId) {
              return {
                ...match,
                ...updateData.updates,
                lastUpdate: new Date(),
                source: 'websocket'
              };
            }
            return match;
          });
          
          return updatedMatches;
        });
      }
      
    } catch (error) {
      console.error('❌ Error handling live match update:', error);
    }
  };

  // Handle match status changes from WebSocket
  const handleMatchStatusChange = (statusData: any) => {
    try {
      console.log('🔄 Processing match status change:', statusData);
      
      // Refresh data when match status changes significantly
      if (statusData.status === 'started' || statusData.status === 'finished' || statusData.status === 'abandoned') {
        console.log('🔄 Match status changed, triggering data refresh');
        loadRealMatches();
      }
      
    } catch (error) {
      console.error('❌ Error handling match status change:', error);
    }
  };

  return (
    <Layout>
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        .blinking {
          animation: blink 2s infinite;
        }
        
        .blink {
          animation: blink 1s infinite;
        }
        
        .bg-dark-blue {
          background-color: #1e3a8a;
        }
        
        .bg-blue {
          background-color: #3b82f6;
        }
        
        .bg-green-600 {
          background-color: #059669;
        }
        
        .bg-gray-200 {
          background-color: #e5e7eb;
        }
        
        .bg-gray-300 {
          background-color: #d1d5db;
        }
        
        .bg-gray-400 {
          background-color: #9ca3af;
        }
        
        .bg-gray-500 {
          background-color: #6b7280;
        }
        
        .bg-yellow-500 {
          background-color: #eab308;
        }
        
        .bg-violet-500 {
          background-color: #8b5cf6;
        }
        
        .text-gray-700 {
          color: #374151;
        }
        
        .text-gray-600 {
          color: #4b5563;
        }
        
        .text-rose-950 {
          color: #881337;
        }
        
        .text-green-600 {
          color: #059669;
        }
        
        .text-blue-600 {
          color: #2563eb;
        }
        
        .text-red-600 {
          color: #dc2626;
        }
        
        .text-orange-500 {
          color: #f97316;
        }
        
        .text-orange-600 {
          color: #ea580c;
        }
        
        .text-white {
          color: #ffffff;
        }
        
        .text-black {
          color: #000000;
        }
        
        .hover\\:bg-\\[\\#21b9bb\\]:hover {
          background-color: #21b9bb;
        }
        
        .hover\\:bg-\\[\\#059669\\]:hover {
          background-color: #059669;
        }
        
        .hover\\:bg-gray-300:hover {
          background-color: #d1d5db;
        }
        
        .hover\\:bg-gray-400:hover {
          background-color: #9ca3af;
        }
        
        .hover\\:bg-yellow-700:hover {
          background-color: #a16207;
        }
        
        .transition-colors {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        
        .rounded {
          border-radius: 0.25rem;
        }
        
        .rounded-lg {
          border-radius: 0.5rem;
        }
        
        .rounded-md {
          border-radius: 0.375rem;
        }
        
        .border {
          border-width: 1px;
        }
        
        .border-b {
          border-bottom-width: 1px;
        }
        
        .border-gray-200 {
          border-color: #e5e7eb;
        }
        
        .border-gray-300 {
          border-color: #d1d5db;
        }
        
        .border-gray-400 {
          border-color: #9ca3af;
        }
        
        .p-2 {
          padding: 0.5rem;
        }
        
        .p-3 {
          padding: 0.75rem;
        }
        
        .px-2 {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        
        .px-3 {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
        }
        
        .py-1\\.5 {
          padding-top: 0.375rem;
          padding-bottom: 0.375rem;
        }
        
        .py-2 {
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
        
        .py-3 {
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
        }
        
        .py-8 {
          padding-top: 2rem;
          padding-bottom: 2rem;
        }
        
        .px-2 {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        
        .mt-1 {
          margin-top: 0.25rem;
        }
        
        .mt-2 {
          margin-top: 0.5rem;
        }
        
        .ml-1 {
          margin-left: 0.25rem;
        }
        
        .ml-2 {
          margin-left: 0.5rem;
        }
        
        .space-x-1 > :not([hidden]) ~ :not([hidden]) {
          margin-left: 0.25rem;
        }
        
        .space-x-2 > :not([hidden]) ~ :not([hidden]) {
          margin-left: 0.5rem;
        }
        
        .space-x-3 > :not([hidden]) ~ :not([hidden]) {
          margin-left: 0.75rem;
        }
        
        .space-y-1 > :not([hidden]) ~ :not([hidden]) {
          margin-top: 0.25rem;
        }
        
        .space-y-2 > :not([hidden]) ~ :not([hidden]) {
          margin-top: 0.5rem;
        }
        
        .w-full {
          width: 100%;
        }
        
        .w-fit {
          width: fit-content;
        }
        
        .w-36 {
          width: 9rem;
        }
        
        .h-4 {
          height: 1rem;
        }
        
        .h-full {
          height: 100%;
        }
        
        .h-50vh {
          height: 50vh;
        }
        
        .text-sm {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        
        .text-base {
          font-size: 1rem;
          line-height: 1.5rem;
        }
        
        .text-lg {
          font-size: 1.125rem;
          line-height: 1.75rem;
        }
        
        .font-\\[500\\] {
          font-weight: 500;
        }
        
        .font-\\[600\\] {
          font-weight: 600;
        }
        
        .font-bold {
          font-weight: 700;
        }
        
        .font-medium {
          font-weight: 500;
        }
        
        .font-semibold {
          font-weight: 600;
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .focus\\:outline-none:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }
        
        .whitespace-nowrap {
          white-space: nowrap;
        }
        
        .capitalize {
          text-transform: capitalize;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-left {
          text-align: left;
        }
        
        .flex {
          display: flex;
        }
        
        .block {
          display: block;
        }
        
        .inline-block {
          display: inline-block;
        }
        
        .flex-col {
          flex-direction: column;
        }
        
        .items-center {
          align-items: center;
        }
        
        .justify-center {
          justify-content: center;
        }
        
        .justify-start {
          justify-content: flex-start;
        }
        
        .overflow-hidden {
          overflow: hidden;
        }
        
        .overflow-x-auto {
          overflow-x: auto;
        }
        
        .overflow-y-auto {
          overflow-y: auto;
        }
        
        .min-w-full {
          min-width: 100%;
        }
        
        .max-w-full {
          max-width: 100%;
        }
        
        .col-span-12 {
          grid-column: span 12 / span 12;
        }
        
        .lg\\:flex {
          display: none;
        }
        
        .lg\\:p-3 {
          padding: 0.75rem;
        }
        
        .lg\\:space-x-1 > :not([hidden]) ~ :not([hidden]) {
          margin-left: 0.25rem;
        }
        
        .lg\\:space-x-3 > :not([hidden]) ~ :not([hidden]) {
          margin-left: 0.75rem;
        }
        
        .lg\\:space-y-0 > :not([hidden]) ~ :not([hidden]) {
          margin-top: 0;
        }
        
        .lg\\:w-36 {
          width: 9rem;
        }
        
        @media (min-width: 1024px) {
          .lg\\:flex {
            display: flex;
          }
          
          .lg\\:p-3 {
            padding: 0.75rem;
          }
          
          .lg\\:space-x-1 > :not([hidden]) ~ :not([hidden]) {
            margin-left: 0.25rem;
          }
          
          .lg\\:space-x-3 > :not([hidden]) ~ :not([hidden]) {
            margin-left: 0.75rem;
          }
          
          .lg\\:space-y-0 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0;
          }
          
          .lg\\:w-36 {
            width: 9rem;
          }
        }
        
        .form-checkbox {
          appearance: none;
          background-color: #fff;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          display: inline-block;
          height: 1rem;
          width: 1rem;
          vertical-align: middle;
          position: relative;
          cursor: pointer;
        }
        
        .form-checkbox:checked {
          background-color: #2563eb;
          border-color: #2563eb;
        }
        
        .form-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 3px;
          top: 1px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .bg-orange-500 {
          background-color: #f97316;
        }
        
        .bg-orange-600 {
          background-color: #ea580c;
        }
        
        .bg-red-600 {
          background-color: #dc2626;
        }
        
        .bg-blue-600 {
          background-color: #2563eb;
        }
        
        .border-2 {
          border-width: 2px;
        }
        
        .border-r {
          border-right-width: 1px;
        }
        
        .shadow-lg {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .text-xs {
          font-size: 0.75rem;
          line-height: 1rem;
        }
        
        .mt-0\\.5 {
          margin-top: 0.125rem;
        }
        
        .ml-1 {
          margin-left: 0.25rem;
        }
        
        .p-1 {
          padding: 0.25rem;
        }
        
        .p-1\\.5 {
          padding: 0.375rem;
        }
        
        .px-1\\.5 {
          padding-left: 0.375rem;
          padding-right: 0.375rem;
        }
        
        .py-1 {
          padding-top: 0.25rem;
          padding-bottom: 0.25rem;
        }
        
        .py-1\\.5 {
          padding-top: 0.375rem;
          padding-bottom: 0.375rem;
        }
        
        .py-2 {
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
        
        .py-4 {
          padding-top: 1rem;
          padding-bottom: 1rem;
        }
        
        .px-1\\.5 {
          padding-left: 0.375rem;
          padding-right: 0.375rem;
        }
        
        .px-2 {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        
        .w-32 {
          width: 8rem;
        }
        
        .h-8 {
          height: 2rem;
        }
        
        .h-0\\.8em {
          height: 0.8em;
        }
        
        .w-0\\.8em {
          width: 0.8em;
        }
        
        .h-10 {
          height: 2.5rem;
        }
        
        .w-10 {
          width: 2.5rem;
        }
        
        .space-x-1 > :not([hidden]) ~ :not([hidden]) {
          margin-left: 0.25rem;
        }
        
        .space-x-2 > :not([hidden]) ~ :not([hidden]) {
          margin-left: 0.5rem;
        }
        
        .space-y-1 > :not([hidden]) ~ :not([hidden]) {
          margin-top: 0.25rem;
        }
        
        .lg\\:space-x-2 > :not([hidden]) ~ :not([hidden]) {
          margin-left: 0.5rem;
        }
        
        .lg\\:w-32 {
          width: 8rem;
        }
      `}</style>
      <div className="h-full overflow-y-auto w-full" style={{ backgroundImage: 'url("/assets/body-bg.jpg")' }}>
        {loading && (
          <div data-testid="wrapper" className="_loading_overlay_wrapper css-79elbk temp001">
            <div className="flex justify-center items-center h-full">
              <div className="text-white text-lg">Loading...</div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Quick Filter Buttons */}
          <div className="w-full bg-white p-2 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex justify-start items-center space-x-2">
                <button 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedMatchType === 'INPLAY' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setSelectedMatchType('INPLAY')}
                >
                  In-Play (Live) ({getFilterCount('INPLAY')})
                </button>
                <button 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedMatchType === 'UPCOMING' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setSelectedMatchType('UPCOMING')}
                >
                  Upcoming ({getFilterCount('UPCOMING')})
                </button>
                <button 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedMatchType === 'COMPLETED' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-400'
                  }`}
                  onClick={() => setSelectedMatchType('COMPLETED')}
                >
                  Completed ({getFilterCount('COMPLETED')})
                </button>
                <button 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedMatchType === 'ABANDONED' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setSelectedMatchType('ABANDONED')}
                >
                  Abandoned / Canceled ({getFilterCount('ABANDONED')})
                </button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="flex-col col-span-12">
            <div className="overflow-x-auto px-1 max-w-full">
              <div className="inline-block min-w-full">
                <div className="lg:p-2 w-full">
                  <table className="bg-white text-gray-900 w-full rounded-lg overflow-hidden shadow-lg" style={{ border: '2px solid #d1d5db' }}>
                    <thead className="bg-dark-blue rounded-t w-full">
                      <tr className="bg-dark-blue text-sm font-semibold tracking-wider text-left text-white capitalize">
                        <th className="px-2 py-2 whitespace-nowrap text-center" style={{ borderRight: '1px solid #9ca3af', borderBottom: '1px solid #9ca3af' }}>Sr No.</th>
                        <th className="px-2 py-2 whitespace-nowrap" style={{ borderRight: '1px solid #9ca3af', borderBottom: '1px solid #9ca3af' }}>Match Id</th>
                        <th className="px-2 py-2 whitespace-nowrap" style={{ borderRight: '1px solid #9ca3af', borderBottom: '1px solid #9ca3af' }}>Match Name</th>
                        <th className="px-2 py-2 whitespace-nowrap text-center" style={{ borderBottom: '1px solid #9ca3af' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-2 py-4 text-center text-gray-500" style={{ borderRight: '1px solid #e5e7eb' }}>
                            <div className="flex flex-col items-center space-y-1">
                              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-base font-medium">No matches found</span>
                              <span className="text-xs">No matches available for the selected filter: <strong>{selectedMatchType}</strong></span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        matches.map((match, index) => (
                          <tr key={match.id} className={`text-sm text-black hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-2 py-2 whitespace-nowrap text-center" style={{ borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                              <span className="font-medium text-gray-700">{index + 1}</span>
                            </td>
                            <td className="px-2 py-2" style={{ borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                              <div className="text-blue-600 leading-tight">
                                {match.beventId
                                  ? (
                                    <>
                                      <div>{match.beventId}</div>
                                      {match.bmarketId && <div className="text-sm">({match.bmarketId})</div>}
                                    </>
                                  )
                                  : match.id}
                              </div>
                            </td>
                            <td className="px-2 py-2" style={{ borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                              <span 
                                className="cursor-pointer text-blue-600 flex items-center text-xs hover:underline"
                                onClick={() => router.push(`/matchEdit/${match.bmarketId || match.id}`)}
                                title="Click to edit match"
                              >
                                {match.matchName}
                                {match.isLive && selectedMatchType === 'INPLAY' && (
                                  <span className="ml-1 text-green-600 blink">●</span>
                                )}
                              </span>
                              <div className="text-xs text-gray-600 mt-0.5">
                                ({match.tournament}) =&gt; 
                                <span className="text-rose-950">({match.date} {match.time})</span> =&gt; 
                                <span className="text-green-600">({match.sport})</span>
                                {match.status !== 'Upcoming' && (
                                  <span className={`font-bold ml-1 ${
                                    match.status === 'Live' ? 'text-green-600' :
                                    match.status === 'Completed' ? 'text-blue-600' :
                                    match.status === 'Abandoned' ? 'text-red-600' :
                                    'text-gray-600'
                                  }`}>
                                    {match.status}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2" style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <div className="flex justify-center items-center space-x-1">
                                <button 
                                  className="text-white font-bold py-1 px-1.5 rounded text-xs bg-dark-blue hover:bg-gray-400 transition-colors"
                                  onClick={() => router.push(`/matchEdit/${match.bmarketId || match.id}`)}
                                  title="Edit Match"
                                >
                                  Edit Match
                                </button>
                                <button 
                                  type="button" 
                                  className="text-white font-bold py-1 px-1.5 rounded text-xs bg-blue hover:bg-gray-400 transition-colors"
                                  onClick={() => handleAction('fancy', match.id)}
                                >
                                  Fancy Dec.
                                </button>
                                <button 
                                  type="button" 
                                  className="text-white font-bold py-1 px-1.5 rounded text-xs bg-gray-500 hover:bg-gray-400 transition-colors"
                                  onClick={() => handleAction('fancy', match.id)}
                                >
                                  Fancy Bet
                                </button>
                                <button 
                                  type="button" 
                                  className="text-white font-bold py-1 px-1.5 rounded text-xs bg-yellow-500 hover:bg-gray-400 transition-colors"
                                  onClick={() => handleAction('match', match.id)}
                                >
                                  Odds Bet
                                </button>
                                <button 
                                  type="button" 
                                  className="text-white font-bold py-1 px-1.5 rounded text-xs bg-violet-500 hover:bg-gray-400 transition-colors"
                                  onClick={() => handleAction('refresh', match.id)}
                                >
                                  Refresh Page
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {decisionModalOpen && selectedMatch && (
        <DecisionModal
          isOpen={decisionModalOpen}
          onClose={() => setDecisionModalOpen(false)}
          match={selectedMatch}
          onDecision={(decision: string) => {
            setDecisionModalOpen(false);
            showToast('Decision saved successfully!', 'success');
            loadRealMatches();
          }}
        />
      )}

      {/* Toast */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      )}
    </Layout>
  );
} 