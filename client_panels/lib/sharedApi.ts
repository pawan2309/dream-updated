// Shared API service for all panels
export interface Match {
  id: string;
  matchId: string;
  matchName: string;
  tournament: string;
  date: string;
  time: string;
  sport: string;
  status: string;
  externalId: string;
  gameId: string; // Add gameId from API
  title: string;
  isLive: boolean;
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
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  }

  // Fetch all matches
  async getMatches(): Promise<ApiResponse<Match[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/matches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      const response = await fetch(`${this.baseUrl}/api/matches?live=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(`${this.baseUrl}/api/matches?status=${status}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      const response = await fetch(`${this.baseUrl}/api/matches/${matchId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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