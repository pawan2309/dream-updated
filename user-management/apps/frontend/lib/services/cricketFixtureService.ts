import { prisma } from '../prisma';
import { Match, MatchStatus } from '@prisma/client';

export interface CricketFixtureData {
  beventId?: string;
  bmarketId?: string;
  name?: string;
  ename?: string;
  tournament?: string;
  cname?: string;
  startTime?: string;
  stime?: string;
  status?: string;
  iplay?: boolean;
  inPlay?: boolean;
  matchType?: string;
  gtype?: string;
  isCricket?: boolean;
  iscc?: boolean;
  teams?: any[];
  brunners?: any[];
}

export interface UpsertedFixture {
  id: string;
  bmarketId: string | null;
  beventId: string | null;
  matchName: string | null;
  tournament: string | null;
  startTime: Date | null;
  isLive: boolean;
  status: MatchStatus;
  matchId: string;
}

export class CricketFixtureService {
  /**
   * Create or update a cricket fixture
   */
  static async upsertFixture(fixture: CricketFixtureData): Promise<UpsertedFixture> {
    try {
      // Check if fixture already exists by beventId or bmarketId
      const existingFixture = await this.findFixtureByExternalIds(fixture);
      
      if (existingFixture) {
        // Update existing fixture
        return await this.updateFixture(existingFixture.id, fixture);
      } else {
        // Create new fixture
        return await this.createFixture(fixture);
      }
    } catch (error) {
      console.error('❌ CricketFixtureService: upsertFixture failed:', error);
      throw error;
    }
  }

  /**
   * Find fixture by external IDs (beventId or bmarketId)
   */
  static async findFixtureByExternalIds(fixture: CricketFixtureData): Promise<Match | null> {
    try {
      if (fixture.beventId) {
        return await prisma.match.findFirst({
          where: { beventId: fixture.beventId }
        });
      } else if (fixture.bmarketId) {
        return await prisma.match.findFirst({
          where: { bmarketId: fixture.bmarketId }
        });
      }
      return null; // No external ID to search by
    } catch (error) {
      console.error('❌ CricketFixtureService: findFixtureByExternalIds failed:', error);
      throw error;
    }
  }

  /**
   * Create a new fixture
   */
  static async createFixture(fixture: CricketFixtureData): Promise<UpsertedFixture> {
    try {
      const fixtureData = {
        title: fixture.name || fixture.ename || 'Cricket Match',
        matchId: fixture.bmarketId || fixture.beventId || 'unknown',
        status: this.mapStatus(fixture.status || fixture.iplay),
        bmarketId: fixture.bmarketId || null,
        beventId: fixture.beventId || null,
        matchName: fixture.name || fixture.ename || null,
        tournament: fixture.tournament || fixture.cname || null,
        startTime: fixture.startTime || fixture.stime ? new Date(fixture.startTime || fixture.stime) : null,
        isLive: Boolean(fixture.inPlay || fixture.iplay),
        matchType: fixture.matchType || fixture.gtype || 'match',
        isCricket: fixture.isCricket !== false && fixture.iscc !== false,
        teams: fixture.teams || fixture.brunners || null,
        lastUpdated: new Date(),
        apiSource: 'marketsarket.qnsports.live',
        isActive: true,
        isDeleted: false
      };

      const result = await prisma.match.create({
        data: fixtureData
      });

      return {
        id: result.id,
        bmarketId: result.bmarketId,
        beventId: result.beventId,
        matchName: result.matchName,
        tournament: result.tournament,
        startTime: result.startTime,
        isLive: result.isLive,
        status: result.status,
        matchId: result.matchId
      };
    } catch (error) {
      console.error('❌ CricketFixtureService: createFixture failed:', error);
      throw error;
    }
  }

  /**
   * Update an existing fixture
   */
  static async updateFixture(fixtureId: string, fixture: CricketFixtureData): Promise<UpsertedFixture> {
    try {
      const updateData = {
        title: fixture.name || fixture.ename || 'Cricket Match',
        status: this.mapStatus(fixture.status || fixture.iplay),
        bmarketId: fixture.bmarketId || null,
        beventId: fixture.beventId || null,
        matchName: fixture.name || fixture.ename || null,
        tournament: fixture.tournament || fixture.cname || null,
        startTime: fixture.startTime || fixture.stime ? new Date(fixture.startTime || fixture.stime) : null,
        isLive: Boolean(fixture.inPlay || fixture.iplay),
        matchType: fixture.matchType || fixture.gtype || 'match',
        isCricket: fixture.isCricket !== false && fixture.iscc !== false,
        teams: fixture.teams || fixture.brunners || null,
        lastUpdated: new Date()
      };

      const result = await prisma.match.update({
        where: { id: fixtureId },
        data: updateData
      });

      return {
        id: result.id,
        bmarketId: result.bmarketId,
        beventId: result.beventId,
        matchName: result.matchName,
        tournament: result.tournament,
        startTime: result.startTime,
        isLive: result.isLive,
        status: result.status,
        matchId: result.matchId
      };
    } catch (error) {
      console.error('❌ CricketFixtureService: updateFixture failed:', error);
      throw error;
    }
  }

  /**
   * Get all active fixtures
   */
  static async getActiveFixtures(): Promise<Match[]> {
    try {
      return await prisma.match.findMany({
        where: { isActive: true, isDeleted: false }
      });
    } catch (error) {
      console.error('❌ CricketFixtureService: getActiveFixtures failed:', error);
      throw error;
    }
  }

  /**
   * Get fixtures by status
   */
  static async getFixturesByStatus(status: MatchStatus): Promise<Match[]> {
    try {
      return await prisma.match.findMany({
        where: { 
          status: status,
          isActive: true, 
          isDeleted: false 
        }
      });
    } catch (error) {
      console.error('❌ CricketFixtureService: getFixturesByStatus failed:', error);
      throw error;
    }
  }

  /**
   * Get live fixtures
   */
  static async getLiveFixtures(): Promise<Match[]> {
    try {
      return await prisma.match.findMany({
        where: { 
          isLive: true,
          isActive: true, 
          isDeleted: false 
        }
      });
    } catch (error) {
      console.error('❌ CricketFixtureService: getLiveFixtures failed:', error);
      throw error;
    }
  }

  /**
   * Map API status to database status
   */
  private static mapStatus(apiStatus: any): MatchStatus {
    if (!apiStatus) return MatchStatus.UPCOMING;
    
    const status = String(apiStatus).toLowerCase();
    
    if (status === 'open' || status === 'scheduled') return MatchStatus.UPCOMING;
    if (status === 'live' || status === 'inplay' || status === 'in_play') return MatchStatus.LIVE;
    if (status === 'completed' || status === 'finished' || status === 'resulted') return MatchStatus.COMPLETED;
    if (status === 'abandoned' || status === 'canceled' || status === 'cancelled') return MatchStatus.ABANDONED;
    if (status === 'suspended') return MatchStatus.SUSPENDED;
    if (status === 'closed') return MatchStatus.CLOSED;
    
    return MatchStatus.UPCOMING; // Default fallback
  }

  /**
   * Bulk upsert fixtures
   */
  static async bulkUpsertFixtures(fixtures: CricketFixtureData[]): Promise<UpsertedFixture[]> {
    try {
      const results: UpsertedFixture[] = [];
      
      for (const fixture of fixtures) {
        try {
          const result = await this.upsertFixture(fixture);
          results.push(result);
        } catch (error) {
          console.warn(`⚠️ CricketFixtureService: Failed to upsert fixture:`, error);
          // Continue with other fixtures
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ CricketFixtureService: bulkUpsertFixtures failed:', error);
      throw error;
    }
  }

  /**
   * Get fixture by beventId
   */
  static async getFixtureByBeventId(beventId: string): Promise<Match | null> {
    try {
      return await prisma.match.findFirst({
        where: { beventId, isActive: true, isDeleted: false }
      });
    } catch (error) {
      console.error('❌ CricketFixtureService: getFixtureByBeventId failed:', error);
      throw error;
    }
  }

  /**
   * Get fixture by bmarketId
   */
  static async getFixtureByBmarketId(bmarketId: string): Promise<Match | null> {
    try {
      return await prisma.match.findFirst({
        where: { bmarketId, isActive: true, isDeleted: false }
      });
    } catch (error) {
      console.error('❌ CricketFixtureService: getFixtureByBmarketId failed:', error);
      throw error;
    }
  }
}
