export interface CasinoGame {
  eventId: string;
  name: string;
  shortName: string;
  betStatus: string;
  minStake: number;
  maxStake: number;
  streamingId: string;
  dataUrl?: string;
  resultUrl?: string;
  lastUpdated?: string;
}

export interface CasinoApiResponse {
  success: boolean;
  message: string;
  data: CasinoGame[];
  source: string;
  lastUpdated: string;
}

class CasinoService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  async getCasinoGames(status?: string, refresh?: boolean): Promise<CasinoApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (refresh) queryParams.append('refresh', 'true');

      const url = `${this.baseUrl}/api/casino${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🎰 Fetching casino games from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CasinoApiResponse = await response.json();
      console.log('✅ Casino games fetched successfully:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching casino games:', error);
      throw error;
    }
  }

  // Get game image based on game name or short name
  getGameImage(game: CasinoGame): string {
    const gameName = game.name.toLowerCase();
    const shortName = game.shortName.toLowerCase();
    
    // Map game names to image paths
    if (gameName.includes('teen') || shortName.includes('teen')) {
      return '/images/teenpatti-t201ex99.png';
    }
    if (gameName.includes('dragon') || gameName.includes('dt') || shortName.includes('dt')) {
      return '/images/dragon-tiger1ex99.png';
    }
    if (gameName.includes('lucky') || shortName.includes('lucky')) {
      return '/images/lucky-seven1ex99.png';
    }
    if (gameName.includes('aaa') || shortName.includes('aaa')) {
      return '/images/aaa1ex99.png';
    }
    if (gameName.includes('card') || shortName.includes('card')) {
      return '/images/32-card-b1ex99.png';
    }
    if (gameName.includes('ab') || shortName.includes('ab')) {
      return '/images/dragon-tiger-21ex99.png';
    }
    
    // Default image
    return '/images/teenpatti-t201ex99.png';
  }

  // Get game route based on game data
  getGameRoute(game: CasinoGame): string {
    const gameName = game.name.toLowerCase();
    const shortName = game.shortName.toLowerCase();
    
    // Map game names to routes
    if (gameName.includes('teen') || shortName.includes('teen')) {
      return `/app/casino/twenty-twenty-teenpatti/${game.streamingId}`;
    }
    if (gameName.includes('dragon') || gameName.includes('dt') || shortName.includes('dt')) {
      return `/app/casino/dragon-tiger/${game.streamingId}`;
    }
    if (gameName.includes('lucky') || shortName.includes('lucky')) {
      return `/app/casino/lucky-7/${game.streamingId}`;
    }
    if (gameName.includes('aaa') || shortName.includes('aaa')) {
      return `/app/casino/aaa/${game.streamingId}`;
    }
    if (gameName.includes('card') || shortName.includes('card')) {
      return `/app/casino/thirty-two-card-b/${game.streamingId}`;
    }
    if (gameName.includes('ab') || shortName.includes('ab')) {
      return `/app/casino/dt202/${game.streamingId}`;
    }
    
    // Default route
    return `/app/casino/game/${game.streamingId}`;
  }
}

export default new CasinoService();
