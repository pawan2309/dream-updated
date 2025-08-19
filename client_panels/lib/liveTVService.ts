export interface LiveTVStream {
  eventId: string;
  streamUrl: string;
  referrer: string;
  streamData: any;
  timestamp: string;
}

export interface LiveTVResponse {
  success: boolean;
  data?: LiveTVStream;
  message?: string;
}

export class LiveTVService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : 'http://localhost:3000';

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';
  }

  /**
   * Get live TV stream for a specific event
   */
  async getLiveStream(eventId: string): Promise<LiveTVResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/live-tv/stream/${eventId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching live TV stream:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch stream'
      };
    }
  }

  /**
   * Get stream URL with proper referrer for HLS.js
   */
  getStreamUrlWithReferrer(eventId: string): string {
    return `https://mis3.sqmr.xyz/rtv.php?eventId=${eventId}`;
  }

  /**
   * Get required headers for HLS.js
   */
  getStreamHeaders(): Record<string, string> {
    return {
      'Referer': 'batxgames.site',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
  }
}

export const liveTVService = new LiveTVService();
