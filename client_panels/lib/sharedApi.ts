import { prisma } from './prisma';

// Shared API service for all panels
export interface Match {
  id: string;
  matchName: string;
  tournament: string;
  date: string;
  time: string;
  isLive: boolean;
  status: string;
  venue?: string;
  // Optional fields that might be present in some responses
  matchId?: string;
  sport?: string;
  gameId?: string;
  title?: string;
  section?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class SharedApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
  }

  // Fetch all matches
  async getMatches(): Promise<ApiResponse<Match[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/provider/cricketmatches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Debug: Log the raw data structure from backend
      console.log('🔍 Raw Backend Data:', data);
      if (data.length > 0) {
        console.log('🔍 Sample Match Object:', data[0]);
        console.log('🔍 Available Fields:', Object.keys(data[0]));
        console.log('🔍 First Match Details:', {
          id: data[0].id,
          name: data[0].name,
          status: data[0].status,
          inPlay: data[0].inPlay,
          iplay: data[0].iplay,
          startTime: data[0].startTime,
          stime: data[0].stime
        });
      }
      
      // Transform the data to match our interface
      const transformedMatches: Match[] = data.map((match: any) => {
        // Debug: Log each match transformation
        console.log('🔍 Processing Match:', {
          id: match.id,
          name: match.name,
          ename: match.ename,
          status: match.status,
          inPlay: match.inPlay,
          iplay: match.iplay,
          startTime: match.startTime,
          stime: match.stime,
          // Add more fields for debugging
          rawStatus: match.status,
          rawInPlay: match.inPlay || match.iplay,
          rawStartTime: match.startTime || match.stime,
          // Debug isLive calculation
          calculatedIsLive: match.inPlay || match.iplay || false,
          inPlayValue: match.inPlay,
          iplayValue: match.iplay
        });
        
        // Parse the start time correctly
        let parsedDate = new Date().toISOString().split('T')[0];
        let parsedTime = new Date().toTimeString().split('T')[0];
        
        if (match.startTime || match.stime) {
          try {
            const startTimeValue = match.startTime || match.stime;
            console.log('🔍 Parsing startTime:', startTimeValue, 'Type:', typeof startTimeValue);
            
            const dateObj = new Date(startTimeValue);
            if (!isNaN(dateObj.getTime())) {
              parsedDate = dateObj.toISOString().split('T')[0];
              parsedTime = dateObj.toTimeString().split(' ')[0];
              console.log('🔍 Parsed successfully:', { parsedDate, parsedTime });
            } else {
              console.log('🔍 Invalid date, using defaults');
            }
          } catch (error) {
            console.log('🔍 Date parsing error:', error);
          }
        }
        
        // Intelligent isLive calculation - check if match has actually started
        let isLive = false;
        if (match.inPlay || match.iplay) {
          // Check if the match time has actually started
          try {
            const startTimeValue = match.startTime || match.stime;
            if (startTimeValue) {
              const matchStartTime = new Date(startTimeValue);
              const now = new Date();
              // Only consider live if match has started and is within reasonable time window
              isLive = !isNaN(matchStartTime.getTime()) && matchStartTime <= now;
              console.log('🔍 isLive Calculation:', {
                startTime: startTimeValue,
                matchStartTime: matchStartTime,
                now: now,
                hasStarted: matchStartTime <= now,
                finalIsLive: isLive
              });
            } else {
              isLive = false;
            }
          } catch (error) {
            console.log('🔍 isLive calculation error:', error);
            isLive = false;
          }
        }
        
        // Map the status correctly - handle 'OPEN' from backend
        let mappedStatus = match.status || 'UPCOMING';
        if (mappedStatus === 'OPEN') {
          mappedStatus = 'UPCOMING';
        } else if (mappedStatus === 'INPLAY' || mappedStatus === 'LIVE') {
          mappedStatus = 'LIVE';
        } else if (mappedStatus === 'FINISHED' || mappedStatus === 'COMPLETED') {
          mappedStatus = 'FINISHED';
        }
        
        console.log('🔍 Status Mapping:', { original: match.status, mapped: mappedStatus });
        
        return {
          id: match.id || match.gmid || `match_${Date.now()}`,
          matchName: match.name || match.ename || 'Unknown Match',
          tournament: match.tournament || match.cname || 'Unknown Tournament',
          date: parsedDate,
          time: parsedTime,
          isLive: isLive,
          status: mappedStatus,
          venue: match.venue,
                   // Set default values for missing fields
         matchId: match.beventId || match.id,
         sport: 'Cricket',
          gameId: match.bmarketId || match.id,
          title: match.name || match.ename || 'Unknown Match',
          section: match.section || []
        };
      });
      
      return {
        success: true,
        data: transformedMatches,
        message: `Successfully fetched ${transformedMatches.length} matches`
      };
    } catch (error) {
      console.error('Error fetching matches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch matches'
      };
    }
  }

  // Fetch live matches
  async getLiveMatches(): Promise<ApiResponse<Match[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/provider/cricketmatches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
             // Filter for live matches and transform the data
       const liveMatches = data.filter((match: any) => 
         match.inPlay || match.iplay || match.status === 'INPLAY' || match.status === 'LIVE'
       );
       
       const transformedMatches: Match[] = liveMatches.map((match: any) => ({
         id: match.id || match.gmid || `match_${Date.now()}`,
         matchName: match.name || match.ename || 'Unknown Match',
         tournament: match.tournament || match.cname || 'Unknown Tournament',
         date: match.startTime ? new Date(match.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
         time: match.startTime ? new Date(match.startTime).toTimeString().split(' ')[0] : '00:00:00',
         isLive: match.inPlay || match.iplay || match.status === 'INPLAY' || match.status === 'LIVE' || false,
         status: match.status || 'LIVE',
         venue: match.venue,
         // Set default values for missing fields
         matchId: match.beventId || match.id,
         sport: 'Cricket',
         gameId: match.bmarketId || match.id,
         title: match.name || match.ename || 'Unknown Match',
         section: match.section || []
       }));
      
      return {
        success: true,
        data: transformedMatches,
        message: `Successfully fetched ${transformedMatches.length} live matches`
      };
      
      // Transform the data to match our interface
      if (data.success && data.data) {
        const transformedMatches: Match[] = data.data.map((match: any) => ({
          id: match.id,
          matchName: match.matchName,
          tournament: match.tournament,
          date: match.date,
          time: match.time,
          isLive: match.isLive,
          status: match.status,
          venue: match.venue,
          // Set default values for missing fields
          matchId: match.matchId || match.id,
          sport: match.sport || 'Cricket',
          gameId: match.gameId || match.id,
          title: match.title || match.matchName,
          section: match.section || []
        }));
        
        return {
          success: true,
          data: transformedMatches,
          message: data.message
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live matches'
      };
    }
  }

  // Fetch matches by status
  async getMatchesByStatus(status: 'INPLAY' | 'UPCOMING' | 'CLOSED'): Promise<ApiResponse<Match[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/provider/cricketmatches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
             // Filter by status and transform the data
       const filteredMatches = data.filter((match: any) => {
         const matchStatus = match.status || 'UPCOMING';
         return matchStatus === status;
       });
       
       const transformedMatches: Match[] = filteredMatches.map((match: any) => ({
         id: match.id || match.gmid || `match_${Date.now()}`,
         matchName: match.ename || 'Unknown Match',
         tournament: match.cname || 'Unknown Tournament',
         date: match.stime ? new Date(match.stime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
         time: match.stime ? new Date(match.stime).toTimeString().split(' ')[0] : '00:00:00',
         isLive: match.iplay || match.status === 'INPLAY' || match.status === 'LIVE' || false,
         status: match.status || 'UPCOMING',
         venue: match.venue,
         // Set default values for missing fields
         matchId: match.beventId || match.id,
         sport: 'Cricket',
         gameId: match.mid || match.id,
         title: match.ename || 'Unknown Match',
         section: match.section || []
       }));
      
      return {
        success: true,
        data: transformedMatches,
        message: `Successfully fetched ${transformedMatches.length} ${status} matches`
      };
    } catch (error) {
      console.error(`Error fetching ${status} matches:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to fetch ${status} matches`
      };
    }
  }

  // Get match by ID
  async getMatchById(matchId: string): Promise<ApiResponse<Match>> {
    try {
      const response = await fetch(`${this.baseUrl}/provider/cricketmatches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
             // Find the specific match by ID
       const match = data.find((m: any) => 
         m.id === matchId || m.gmid === matchId || m.beventId === matchId
       );
       
       if (!match) {
         return {
           success: false,
           error: 'Match not found'
         };
       }
       
       // Transform the data to match our interface
       const transformedMatch: Match = {
         id: match.id || match.gmid || `match_${Date.now()}`,
         matchName: match.ename || 'Unknown Match',
         tournament: match.cname || 'Unknown Tournament',
         date: match.stime ? new Date(match.stime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
         time: match.stime ? new Date(match.stime).toTimeString().split(' ')[0] : '00:00:00',
         isLive: match.iplay || match.status === 'INPLAY' || match.status === 'LIVE' || false,
         status: match.status || 'UPCOMING',
         venue: match.venue,
         // Set default values for missing fields
         matchId: match.beventId || match.id,
         sport: 'Cricket',
         gameId: match.mid || match.id,
         title: match.ename || 'Unknown Match',
         section: match.section || []
       };
      
      return {
        success: true,
        data: transformedMatch,
        message: 'Match found successfully'
      };
    } catch (error) {
      console.error('Error fetching match:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch match'
      };
    }
  }
}

export const sharedApiService = new SharedApiService(); 