// WebSocket service for real-time betting updates
export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface WebSocketSubscription {
  unsubscribe: () => void;
}

export interface LiveMatchUpdate {
  matchId: string;
  data: any;
  timestamp: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // Replace with your actual WebSocket URL
      this.ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080');
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.subscriptions.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(eventType: string, callback: (data: any) => void): WebSocketSubscription {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    const handlers = this.subscriptions.get(eventType)!;
    handlers.add(callback);

    return {
      unsubscribe: () => {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.subscriptions.delete(eventType);
        }
      }
    };
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Subscribe to specific match updates
  subscribeToMatch(matchId: string) {
    this.send({
      type: 'subscribe_match',
      data: { matchId }
    });
  }

  // Unsubscribe from specific match updates
  unsubscribeFromMatch(matchId: string) {
    this.send({
      type: 'unsubscribe_match',
      data: { matchId }
    });
  }

  // Request in-play matches
  requestInPlayMatches() {
    this.send({
      type: 'request_inplay_matches',
      data: {}
    });
  }

  // Authenticate with the WebSocket server
  async authenticate(): Promise<boolean> {
    try {
      // For now, return true as authentication is not implemented
      // You can implement actual authentication logic here
      return true;
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      return false;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const websocketService = new WebSocketService();
