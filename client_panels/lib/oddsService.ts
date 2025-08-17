export interface BettingMarket {
  id: string;
  name: string;
  type: 'match_winner' | 'tied_match' | 'over_runs' | 'custom';
  minStake: number;
  maxStake: number;
  status: 'active' | 'suspended' | 'settled';
  selections: BettingSelection[];
  description?: string;
}

export interface BettingSelection {
  id: string;
  name: string;
  odds: number;
  stake: number;
  status: 'active' | 'suspended' | 'settled';
  type?: 'back' | 'lay';
  tier?: number; // 1 = best odds, 2 = second best, etc.
}

export interface OddsData {
  matchId: string;
  lastUpdated: string;
  markets: BettingMarket[];
  source?: string;
  error?: string;
}

export interface OddsApiResponse {
  success: boolean;
  data?: OddsData;
  message?: string;
  error?: string;
}

class OddsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
  }

  // Fetch odds for a specific match
  async getMatchOdds(matchId: string): Promise<OddsApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/odds/${matchId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Odds fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching odds:', error);
      
      return {
        success: false,
        error: 'Failed to fetch odds',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default new OddsService();
