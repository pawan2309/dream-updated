// Sports Data API Service
import { createExternalApiService, ApiResponse } from '../externalApi';
import { externalApiConfigs } from '../config/externalApis';
import { rateLimiters } from '../rateLimiter';

// Types for sports data
interface Match {
  id: string;
  title: string;
  externalId: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  startTime: string;
  homeTeam: string;
  awayTeam: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: 'FINISHED';
  winner?: 'HOME' | 'AWAY' | 'DRAW';
}

class SportsDataService {
  private api = createExternalApiService(externalApiConfigs.sportsData);
  private rateLimiter = rateLimiters.sportsData;

  async getMatches(useCache = true): Promise<ApiResponse<Match[]>> {
    // Check rate limit
    if (!this.rateLimiter.canMakeRequest('sportsData')) {
      await this.rateLimiter.waitForAvailability('sportsData');
    }

    this.rateLimiter.logRequest('sportsData');
    
    return this.api.get<Match[]>('/matches', useCache);
  }

  async getMatchById(matchId: string, useCache = true): Promise<ApiResponse<Match>> {
    if (!this.rateLimiter.canMakeRequest('sportsData')) {
      await this.rateLimiter.waitForAvailability('sportsData');
    }

    this.rateLimiter.logRequest('sportsData');
    
    return this.api.get<Match>(`/matches/${matchId}`, useCache);
  }

  async getMatchResult(matchId: string): Promise<ApiResponse<MatchResult>> {
    if (!this.rateLimiter.canMakeRequest('sportsData')) {
      await this.rateLimiter.waitForAvailability('sportsData');
    }

    this.rateLimiter.logRequest('sportsData');
    
    return this.api.get<MatchResult>(`/matches/${matchId}/result`);
  }

  async updateMatchStatus(matchId: string, status: string): Promise<ApiResponse<void>> {
    if (!this.rateLimiter.canMakeRequest('sportsData')) {
      await this.rateLimiter.waitForAvailability('sportsData');
    }

    this.rateLimiter.logRequest('sportsData');
    
    return this.api.put<void>(`/matches/${matchId}/status`, { status });
  }

  // Get remaining API calls
  getRemainingRequests() {
    return this.rateLimiter.getRemainingRequests('sportsData');
  }

  // Clear cache
  clearCache() {
    this.api.clearCache();
  }
}

// Export singleton instance
export const sportsDataService = new SportsDataService();
export type { Match, MatchResult }; 