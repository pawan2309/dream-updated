import { useCallback } from 'react';

interface MatchData {
  eventId: string;
  eventName?: string;
  name?: string;
  status?: string;
  iplay?: boolean;
  inPlay?: boolean;
  tournament?: string;
  cname?: string;
  startTime?: string;
  stime?: string;
  teams?: any[];
  brunners?: any[];
  matchType?: string;
  gtype?: string;
  raw?: any;
  apiSource?: string;
  bmarketId?: string;
}

export function useAutoMatchSync() {
  /**
   * Automatically sync a match to the database
   * This ensures the match exists before bet placement
   */
  const syncMatch = useCallback(async (matchData: MatchData) => {
    try {
      if (!matchData.eventId) {
        console.warn('[AUTO-SYNC] Missing eventId for match sync');
        return null;
      }

      console.log(`🔄 [AUTO-SYNC] Syncing match ${matchData.eventId} to database...`);

      const response = await fetch('/api/matches/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync match');
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ [AUTO-SYNC] Match ${matchData.eventId} synced successfully:`, result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Match sync failed');
      }

    } catch (error) {
      console.error(`❌ [AUTO-SYNC] Failed to sync match ${matchData.eventId}:`, error);
      // Don't throw error - just log it so it doesn't break the main flow
      return null;
    }
  }, []);

  /**
   * Sync match when odds data is received
   * This is the main function to call when you get odds data
   */
  const syncMatchFromOdds = useCallback(async (oddsData: any) => {
    try {
      // Extract match information from odds data
      // Prioritize eventId from API data (this is the actual external ID like 34626187)
      const matchData: MatchData = {
        eventId: oddsData.eventId || oddsData.beventId || oddsData.id,
        eventName: oddsData.eventName || oddsData.name,
        name: oddsData.name || oddsData.eventName,
        status: oddsData.status || oddsData.iplay,
        iplay: oddsData.iplay,
        inPlay: oddsData.inPlay,
        
        // Enhanced fields as requested
        tournament: oddsData.tournament || oddsData.cname,
        cname: oddsData.cname || oddsData.tournament,
        startTime: oddsData.startTime || oddsData.stime,
        stime: oddsData.stime || oddsData.startTime,
        teams: oddsData.teams || oddsData.brunners,
        brunners: oddsData.brunners || oddsData.teams,
        matchType: oddsData.matchType || oddsData.gtype,
        gtype: oddsData.gtype || oddsData.matchType,
        
        // Additional fields
        apiSource: oddsData.apiSource || 'shamexch.xyz',
        bmarketId: oddsData.bmarketId || oddsData.marketId,
        
        raw: oddsData
      };

      if (!matchData.eventId) {
        console.warn('[AUTO-SYNC] Cannot sync match: missing eventId in odds data');
        return null;
      }

      console.log(`🔄 [AUTO-SYNC] Syncing match ${matchData.eventId} with enhanced data:`, {
        eventName: matchData.eventName,
        tournament: matchData.tournament,
        startTime: matchData.startTime,
        teams: matchData.teams,
        apiSource: matchData.apiSource,
        bmarketId: matchData.bmarketId
      });

      return await syncMatch(matchData);

    } catch (error) {
      console.error('[AUTO-SYNC] Error syncing match from odds:', error);
      return null;
    }
  }, [syncMatch]);

  /**
   * Force sync a specific match by event ID
   * Useful for manual sync operations
   */
  const forceSyncMatch = useCallback(async (eventId: string, additionalData: Partial<MatchData> = {}) => {
    const matchData: MatchData = {
      eventId,
      ...additionalData
    };

    return await syncMatch(matchData);
  }, [syncMatch]);

  return {
    syncMatch,
    syncMatchFromOdds,
    forceSyncMatch
  };
}
