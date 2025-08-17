// Scorecard service for fetching live match data
export interface ScorecardData {
  eventId: string;
  team1: {
    abbreviation: string;
    score: string;
    runRate: string;
    isActive: boolean;
  };
  team2: {
    abbreviation: string;
    score: string;
    runRate: string;
    isActive: boolean;
  };
  currentOver: string[];
  isFinished: boolean;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ScorecardService {
  private baseUrl: string;

  constructor() {
    // Use the frontend API endpoint instead of calling backend directly
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  }

  async getScorecard(eventId: string): Promise<ApiResponse<ScorecardData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scorecard/${eventId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      
      // Transform the raw API data to match our interface
      const transformedData = this.transformScorecardData(rawData, eventId);
      
      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      console.error('Error fetching scorecard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private transformScorecardData(rawData: any, eventId: string): ScorecardData {
    // Handle the actual API response structure
    if (rawData.type === 1 && rawData.data) {
      const data = rawData.data;
      
      return {
        eventId,
        team1: {
          abbreviation: data.spnnation1 || 'T1',
          score: data.score1 || '0-0',
          runRate: data.spnrunrate1 || '0.00',
          isActive: data.activenation1 === '1'
        },
        team2: {
          abbreviation: data.spnnation2 || 'T2',
          score: data.score2 || '0-0',
          runRate: data.spnrunrate2 || '0.00',
          isActive: data.activenation2 === '1'
        },
        currentOver: data.balls || [],
        isFinished: data.isfinished === '1',
        message: data.spnmessage || undefined
      };
    }

    // Fallback to default data if structure doesn't match
    return {
      eventId,
      team1: {
        abbreviation: 'T1',
        score: '0-0',
        runRate: '0.00',
        isActive: false
      },
      team2: {
        abbreviation: 'T2',
        score: '0-0',
        runRate: '0.00',
        isActive: false
      },
      currentOver: [],
      isFinished: false
    };
  }
}

export const scorecardService = new ScorecardService();
