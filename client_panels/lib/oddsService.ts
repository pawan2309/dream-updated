export interface BettingMarket {
  id: string;
  marketId: string; // Internal market identifier
  name: string;
  type: 'match_winner' | 'tied_match' | 'over_runs' | 'custom' | 'fancy' | 'bookmaker';
  minStake: number;
  maxStake: number;
  status: 'active' | 'suspended' | 'settled' | 'OPEN' | 'SUSPENDED' | 'CLOSED';
  selections: BettingSelection[];
  description?: string;
  gtype?: string; // fancy, match_odds, session
}

export interface BettingSelection {
  id: string;
  name: string;
  odds: number;
  stake: number;
  status: 'active' | 'suspended' | 'settled';
  gstatus?: string; // Global status from API (ACTIVE, SUSPENDED, BALL RUNNING, etc.)
  type?: 'back' | 'lay';
  tier?: number; // 1 = best odds, 2 = second best, etc.
}

export interface OddsData {
  matchId: string;
  matchName?: string;
  matchType?: string;
  sportType?: string;
  tournament?: string;
  startTime?: string;
  status?: string;
  isLive?: boolean;
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

export interface BetData {
  matchId: string;
  marketId: string;
  selection: string;
  stake: number;
  odds: number;
  betType: 'back' | 'lay';
}

export interface BetApiResponse {
  success: boolean;
  data?: {
    betId: string;
    balanceAfter: number;
    message: string;
  };
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

  // Place a bet
  async placeBet(betData: BetData): Promise<BetApiResponse> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${this.baseUrl}/api/bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(betData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Bet placed successfully'
      };
    } catch (error) {
      console.error('Error placing bet:', error);
      
      return {
        success: false,
        error: 'Failed to place bet',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get user bets
  async getUserBets(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${this.baseUrl}/api/bet/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.bets || []
      };
    } catch (error) {
      console.error('Error fetching user bets:', error);
      
      return {
        success: false,
        error: 'Failed to fetch user bets'
      };
    }
  }
}

export default new OddsService();
