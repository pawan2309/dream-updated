import { prisma } from '../prisma';

export interface FixtureData {
  eventId: string;
  ename: string;
  bvent: string;
  bmarket: string;
  cname: string;
  stime: string;
  iplay?: boolean;
  team1?: string;
  team2?: string;
  score1?: string;
  score2?: string;
}

export interface MatchData {
  matchId: string;      // beventId from API
  matchName: string;    // ename from API
  sport: string;        // default "cricket"
  bevent: string;       // bvent from API
  bmarket: string;      // bmarket from API
  tournament: string;   // cname from API
  startTime: Date | null; // stime from API
  isLive: boolean;      // calculated from stime
  isActive: boolean;    // default true
  status: string;       // calculated from stime and iplay
}

export class CricketFixtureService {
  /**
   * Calculate if match is live based on start time
   */
  private static calculateIsLive(stime: string, iplay?: boolean): boolean {
    if (iplay === true) return true;
    
    try {
      const startTime = new Date(stime);
      if (isNaN(startTime.getTime())) return false;
      
      const now = new Date();
      const timeDiff = now.getTime() - startTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Match is live if it started within the last 24 hours
      return hoursDiff >= 0 && hoursDiff <= 24;
    } catch (error) {
      console.error('Error calculating isLive:', error);
      return false;
    }
  }

  /**
   * Calculate match status based on start time and iplay
   */
  private static calculateStatus(stime: string, iplay?: boolean): string {
    if (iplay === true) return 'LIVE';
    
    try {
      const startTime = new Date(stime);
      if (isNaN(startTime.getTime())) return 'UPCOMING';
      
      const now = new Date();
      
      if (startTime > now) {
        return 'UPCOMING';
      } else if (startTime <= now && startTime > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
        return 'LIVE';
      } else {
        return 'COMPLETED';
      }
    } catch (error) {
      console.error('Error calculating status:', error);
      return 'UPCOMING';
    }
  }

  /**
   * Parse start time from fixture data
   */
  private static parseStartTime(stime: string): Date | null {
    try {
      const startTime = new Date(stime);
      if (isNaN(startTime.getTime())) {
        // Try parsing different date formats
        const parts = stime.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)\s+(AM|PM)/);
        if (parts) {
          const [_, month, day, year, hour, minute, second, ampm] = parts;
          let hour24 = parseInt(hour);
          if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
          if (ampm === 'AM' && hour24 === 12) hour24 = 0;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
        }
        return null;
      }
      return startTime;
    } catch (error) {
      console.error('Error parsing start time:', error);
      return null;
    }
  }

  /**
   * Save or update match data from fixture API
   */
  static async saveMatchFromFixture(fixture: FixtureData): Promise<MatchData> {
    try {
      const startTime = this.parseStartTime(fixture.stime);
      const isLive = this.calculateIsLive(fixture.stime, fixture.iplay);
      const status = this.calculateStatus(fixture.stime, fixture.iplay);

      const matchData: MatchData = {
        matchId: fixture.eventId,           // beventId from API
        matchName: fixture.ename,           // ename from API
        sport: 'cricket',                   // default to cricket
        bevent: fixture.bvent,              // bvent from API
        bmarket: fixture.bmarket,           // bmarket from API
        tournament: fixture.cname,          // cname from API
        startTime: startTime,               // parsed stime from API
        isLive: isLive,                     // calculated from stime
        isActive: true,                     // default true
        status: status                      // calculated from stime and iplay
      };

      // Check if match already exists
      const existingMatch = await prisma.match.findUnique({
        where: { matchId: fixture.eventId }
      });

      if (existingMatch) {
        // Update existing match
        const updatedMatch = await prisma.match.update({
          where: { matchId: fixture.eventId },
          data: {
            matchName: fixture.ename,
            bevent: fixture.bvent,
            bmarket: fixture.bmarket,
            tournament: fixture.cname,
            startTime: startTime,
            isLive: isLive,
            status: status as any, // Cast to MatchStatus enum
            lastUpdated: new Date()
          }
        });

        console.log(`✅ Updated existing match: ${fixture.eventId}`);
        return matchData;
      } else {
        // Create new match
        const newMatch = await prisma.match.create({
          data: {
            matchId: fixture.eventId,
            matchName: fixture.ename,
            sport: 'cricket',
            bevent: fixture.bvent,
            bmarket: fixture.bmarket,
            tournament: fixture.cname,
            startTime: startTime,
            isLive: isLive,
            isActive: true,
            status: status as any, // Cast to MatchStatus enum
            teams: {
              team1: fixture.team1 || 'Team 1',
              team2: fixture.team2 || 'Team 2',
              score1: fixture.score1 || '0-0',
              score2: fixture.score2 || '0-0'
            }
          }
        });

        console.log(`✅ Created new match: ${fixture.eventId}`);
        return matchData;
      }
    } catch (error) {
      console.error(`❌ Error saving match ${fixture.eventId}:`, error);
      throw error;
    }
  }

  /**
   * Save multiple matches from fixture API response
   * This method ensures no duplicates and marks matches as completed when they're no longer in API
   */
  static async saveMatchesFromFixtures(fixtures: FixtureData[]): Promise<MatchData[]> {
    try {
      // Get all current match IDs from the API response
      const currentMatchIds = fixtures.map(f => f.eventId);
      
      // Get all existing matches from database
      const existingMatches = await prisma.match.findMany({
        where: {
          isDeleted: false
        },
        select: {
          matchId: true,
          status: true
        }
      });

      // Mark matches as completed if they're no longer in the API response
      const matchesToComplete = existingMatches.filter(
        existing => !currentMatchIds.includes(existing.matchId) && 
                   existing.status !== 'COMPLETED' && 
                   existing.status !== 'SETTLED'
      );

      if (matchesToComplete.length > 0) {
        console.log(`🔄 Marking ${matchesToComplete.length} matches as completed (no longer in API)`);
        
        await prisma.match.updateMany({
          where: {
            matchId: {
              in: matchesToComplete.map(m => m.matchId)
            }
          },
          data: {
            status: 'COMPLETED',
            isLive: false,
            lastUpdated: new Date()
          }
        });

        console.log(`✅ Marked ${matchesToComplete.length} matches as completed`);
      }

      // Save or update current matches (this prevents duplicates)
      const savedMatches: MatchData[] = [];
      
      for (const fixture of fixtures) {
        try {
          const matchData = await this.saveMatchFromFixture(fixture);
          savedMatches.push(matchData);
        } catch (error) {
          console.error(`❌ Failed to save fixture ${fixture.eventId}:`, error);
          // Continue with other fixtures
        }
      }

      console.log(`✅ Successfully saved ${savedMatches.length} out of ${fixtures.length} fixtures`);
      console.log(`🔄 Marked ${matchesToComplete.length} matches as completed`);
      
      return savedMatches;
    } catch (error) {
      console.error('❌ Error in saveMatchesFromFixtures:', error);
      throw error;
    }
  }

  /**
   * Get all active matches
   */
  static async getActiveMatches() {
    return await prisma.match.findMany({
      where: {
        isActive: true,
        isDeleted: false
      },
      orderBy: {
        startTime: 'desc'
      }
    });
  }

  /**
   * Get live matches
   */
  static async getLiveMatches() {
    return await prisma.match.findMany({
      where: {
        isLive: true,
        isActive: true,
        isDeleted: false
      },
      orderBy: {
        startTime: 'desc'
      }
    });
  }

  /**
   * Get match by ID
   */
  static async getMatchById(matchId: string) {
    return await prisma.match.findUnique({
      where: { matchId }
    });
  }

  /**
   * Update match status (for control panel)
   */
  static async updateMatchStatus(matchId: string, status: string, isActive?: boolean) {
    return await prisma.match.update({
      where: { matchId },
      data: {
        status: status as any,
        isActive: isActive !== undefined ? isActive : true,
        lastUpdated: new Date()
      }
    });
  }

  /**
   * Set match winner and settle (for control panel)
   */
  static async settleMatch(matchId: string, winner: string, result: string) {
    return await prisma.match.update({
      where: { matchId },
      data: {
        winner,
        result,
        settledAt: new Date(),
        status: 'SETTLED' as any,
        lastUpdated: new Date()
      }
    });
  }
}

export default CricketFixtureService;
