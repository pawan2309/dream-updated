import { Match } from './sharedApi';

export interface LiveMatchUpdate {
  type: 'match_update' | 'score_update' | 'odds_update' | 'status_change';
  matchId: string;
  data: any;
  timestamp: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface AuthToken {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;
  private authToken: string | null = null;
  private isAuthenticating = false;

  constructor() {
    // Don't auto-connect, wait for authentication
  }

  // Authenticate and get token
  async authenticate(username: string = 'poc_user', password: string = 'poc123'): Promise<boolean> {
    if (this.isAuthenticating) return false;
    
    try {
      this.isAuthenticating = true;
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
      const response = await fetch(`${baseUrl}/public-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const result = await response.json();
      
      if (result.success && result.data.token) {
        this.authToken = result.data.token;
        console.log('✅ Authentication successful:', result.data.user.username);
        
        // Connect after successful authentication
        this.connect();
        return true;
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return false;
    } finally {
      this.isAuthenticating = false;
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // Get current user info
  getCurrentUser() {
    if (!this.authToken) return null;
    
    try {
      const payload = JSON.parse(atob(this.authToken.split('.')[1]));
      return {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
        permissions: payload.permissions
      };
    } catch {
      return null;
    }
  }

  private connect() {
    if (!this.authToken) {
      console.error('❌ Cannot connect: No authentication token');
      return;
    }

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001';
      // Add auth token to WebSocket URL
      const wsUrlWithAuth = `${wsUrl}?token=${encodeURIComponent(this.authToken)}`;
      this.socket = new WebSocket(wsUrlWithAuth);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', {});
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.emit('disconnected', {});
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
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
      this.emit('max_reconnect_attempts', {});
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'inplay_matches':
        this.emit('inplay_matches', message.data);
        break;
      case 'match_update':
        this.emit('match_update', message.data);
        break;
      case 'score_update':
        this.emit('score_update', message.data);
        break;
      case 'odds_update':
        this.emit('odds_update', message.data);
        break;
      case 'status_change':
        this.emit('status_change', message.data);
        break;
      default:
        this.emit(message.type, message.data);
    }
  }

  public subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  public send(message: any) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  public requestInPlayMatches() {
    this.send({
      type: 'request_inplay_matches',
      timestamp: Date.now()
    });
  }

  public subscribeToMatch(matchId: string) {
    this.send({
      type: 'subscribe_match',
      matchId,
      timestamp: Date.now()
    });
  }

  public unsubscribeFromMatch(matchId: string) {
    this.send({
      type: 'unsubscribe_match',
      matchId,
      timestamp: Date.now()
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  public getConnectionStatus() {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();
