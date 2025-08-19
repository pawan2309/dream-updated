import { io, Socket } from 'socket.io-client';

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

export class WebSocketService {
  private socket: Socket | null = null;
  private authToken: string | null = null;
  private connectionStatus: boolean = false;
  private isAuthenticating: boolean = false;
  private eventListeners: { [key: string]: Function[] } = {};
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize with stored token
    this.authToken = localStorage.getItem('authToken');
    console.log('🔍 WebSocket service initialized, auth token:', this.authToken ? 'Available' : 'Not available');
    
    // Auto-connect if token is available
    if (this.authToken) {
      console.log('🚀 Auto-connecting WebSocket from constructor...');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        this.authenticate();
      }, 100);
    }
  }

  // Authenticate and get token
  async authenticate(): Promise<boolean> {
    if (this.isAuthenticating) return false;
    
    try {
      this.isAuthenticating = true;
      console.log('🔐 WebSocket authentication started...');
      
      // Get user data and token from localStorage
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('authToken');
      
      console.log('🔍 WebSocket auth check:', { 
        hasUserData: !!userData, 
        hasToken: !!token, 
        tokenLength: token ? token.length : 0 
      });
      
      if (token) {
        this.authToken = token;
        console.log('✅ WebSocket authentication successful using localStorage token');
        
        // Check available ports first
        const availablePorts = await this.checkAvailablePorts();
        console.log('🔍 Available ports for WebSocket:', availablePorts);
        
        // Attempt connection
        this.connect();
        return true;
      } else {
        console.error('❌ No auth token found in localStorage');
        return false;
      }
      
    } catch (error) {
      console.error('❌ WebSocket authentication error:', error);
      return false;
    } finally {
      this.isAuthenticating = false;
    }
  }

  // Check if backend WebSocket server is available
  private async checkBackendAvailability(): Promise<boolean> {
    try {
      // Try to connect to the backend API to check if it's running
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
      const response = await fetch(`${baseUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.log('❌ Backend WebSocket server not available:', error);
      return false;
    }
  }

  // Check what ports are actually available
  private async checkAvailablePorts(): Promise<string[]> {
    const ports = [4001, 8080, 3001, 3000];
    const availablePorts: string[] = [];
    
    console.log('🔍 Checking available backend ports...');
    
    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(1000) // Reduced from 2000ms to 1000ms for faster connection
        });
        
        if (response.ok) {
          availablePorts.push(port.toString());
          console.log(`✅ Port ${port} is available`);
          // Stop checking other ports once we find the main one (4001)
          if (port === 4001) break;
        }
      } catch (error) {
        console.log(`❌ Port ${port} is not available`);
      }
    }
    
    console.log('🔍 Available ports:', availablePorts);
    return availablePorts;
  }

  // Event emitter methods
  private emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => listener(data));
    }
  }

  on(event: string, listener: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(l => l !== listener);
    }
  }

  // Setup socket event listeners
  private setupSocketListeners(socket: Socket) {
    // Add any specific event listeners here
    console.log('🔌 Setting up Socket.IO event listeners');
    
    // Listen for cricket fixtures updates
    socket.on('cricket:fixtures:refresh', (data) => {
      console.log('📡 Received cricket fixtures refresh:', data);
      this.emit('cricket:fixtures:refresh', data);
    });
    
    // Listen for cricket odds updates
    socket.on('cricket:odds:refresh', (data) => {
      console.log('📡 Received cricket odds refresh:', data);
      this.emit('cricket:odds:refresh', data);
    });
    
    // Listen for scorecard updates
    socket.on('cricket:scorecard:detailed:refresh', (data) => {
      console.log('📡 Received scorecard refresh:', data);
      this.emit('cricket:scorecard:refresh', data);
    });
    
    // Listen for casino results updates
    socket.on('casino:results:refresh', (data) => {
      console.log('📡 Received casino results refresh:', data);
      this.emit('casino:results:refresh', data);
    });
  }

  // Connect to WebSocket server
  private connect() {
    if (this.socket && this.socket.connected) {
      console.log('Socket.IO already connected');
      return;
    }

    try {
      // Get authentication token
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No auth token available for WebSocket connection');
        this.connectionStatus = false;
        return;
      }

      // Try multiple Socket.IO URLs with fallbacks
      const socketUrls = [
        process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4001',
        process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:8080',
        'http://localhost:4001',
        'http://localhost:8080'
      ];

      console.log('🔍 Available Socket.IO URLs to try:', socketUrls);

      let connected = false;
      for (const socketUrl of socketUrls) {
        try {
          console.log(`🔌 Attempting Socket.IO connection to: ${socketUrl}`);
          
          if (this.authToken) {
            // Socket.IO with authentication in handshake
            this.socket = io(socketUrl, {
              transports: ['websocket', 'polling'],
              auth: {
                token: this.authToken
              },
              query: {
                token: this.authToken
              },
              timeout: 10000,
              forceNew: true
            });
            
            this.socket.on('connect', () => {
              console.log(`✅ Socket.IO connected to: ${socketUrl}`);
              this.connectionStatus = true;
              this.emit('connected');
              connected = true;
            });
            
            this.socket.on('disconnect', (reason) => {
              console.log(`🔌 Socket.IO disconnected from: ${socketUrl}`, reason);
              this.connectionStatus = false;
              this.emit('disconnected');
              
              // Attempt reconnection if not manually disconnected
              if (reason !== 'io client disconnect') {
                setTimeout(() => this.attemptReconnect(), 5000);
              }
            });
            
            this.socket.on('connect_error', (error) => {
              console.error(`❌ Socket.IO connection error on ${socketUrl}:`, error);
              this.connectionStatus = false;
            });
            
            this.socket.on('error', (error) => {
              console.error(`❌ Socket.IO error on ${socketUrl}:`, error);
              this.connectionStatus = false;
            });
            
            this.setupSocketListeners(this.socket);
            break;
          }
          
          // Wait a bit to see if connection succeeds
          setTimeout(() => {
            if (!connected && this.socket && !this.socket.connected) {
              console.log(`❌ Connection to ${socketUrl} failed, trying next...`);
              if (this.socket && this.socket.disconnect) this.socket.disconnect();
            }
          }, 2000);
          
        } catch (error) {
          console.error(`❌ Failed to connect to ${socketUrl}:`, error);
          continue;
        }
      }
      
      if (!connected) {
        console.error('❌ Failed to connect to any Socket.IO URL');
        this.connectionStatus = false;
        this.emit('connection_failed');
      }
      
    } catch (error) {
      console.error('❌ Socket.IO connection error:', error);
      this.connectionStatus = false;
      this.emit('connection_error', error);
    }
  }

  // Attempt reconnection
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      // Exponential backoff with max delay
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached, stopping reconnection attempts');
      this.emit('max_reconnect_attempts', {});
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

  // Update auth token
  updateAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
    console.log('🔐 WebSocket auth token updated');
  }

  // Disconnect and cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus = false;
    this.eventListeners = {};
  }

  public getConnectionStatus() {
    return this.connectionStatus;
  }

  // Subscribe to events
  public subscribe(event: string, callback: (data: any) => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  // Send message
  public send(message: any) {
    if (this.socket && this.connectionStatus) {
      this.socket.emit('message', message);
    } else {
      console.warn('Socket.IO not connected, message not sent:', message);
    }
  }

  // Request in-play matches
  public requestInPlayMatches() {
    this.send({
      type: 'request_inplay_matches',
      timestamp: Date.now()
    });
  }

  // Subscribe to match updates
  public subscribeToMatch(matchId: string) {
    this.send({
      type: 'subscribe_match',
      matchId,
      timestamp: Date.now()
    });
  }

  // Unsubscribe from match updates
  public unsubscribeFromMatch(matchId: string) {
    this.send({
      type: 'unsubscribe_match',
      matchId,
      timestamp: Date.now()
    });
  }

  // Optimized real-time updates for match page (prevents page refresh)
  subscribeToMatchUpdates(matchId: string, callbacks: {
    onOddsUpdate?: (data: any) => void;
    onFancyUpdate?: (data: any) => void;
    onScoreUpdate?: (data: any) => void;
    onStatusUpdate?: (data: any) => void;
    onMarketUpdate?: (data: any) => void;
  }) {
    if (!this.socket || !this.connectionStatus) {
      console.warn('⚠️ WebSocket not connected, cannot subscribe to match updates');
      return () => {};
    }

    console.log(`🔌 [WEBSOCKET] Subscribing to optimized updates for match: ${matchId}`);

    // Subscribe to specific match updates
    this.socket.emit('subscribe_match', { matchId });

    // Set up optimized event listeners
    const oddsListener = (data: any) => {
      if (data.matchId === matchId && callbacks.onOddsUpdate) {
        console.log('🔄 [WEBSOCKET] Optimized odds update received:', data);
        callbacks.onOddsUpdate(data);
      }
    };

    const fancyListener = (data: any) => {
      if (data.matchId === matchId && callbacks.onFancyUpdate) {
        console.log('🔄 [WEBSOCKET] Optimized fancy update received:', data);
        callbacks.onFancyUpdate(data);
      }
    };

    const scoreListener = (data: any) => {
      if (data.matchId === matchId && callbacks.onScoreUpdate) {
        console.log('🔄 [WEBSOCKET] Optimized score update received:', data);
        callbacks.onScoreUpdate(data);
      }
    };

    const statusListener = (data: any) => {
      if (data.matchId === matchId && callbacks.onStatusUpdate) {
        console.log('🔄 [WEBSOCKET] Optimized status update received:', data);
        callbacks.onStatusUpdate(data);
      }
    };

    const marketListener = (data: any) => {
      if (data.matchId === matchId && callbacks.onMarketUpdate) {
        console.log('🔄 [WEBSOCKET] Optimized market update received:', data);
        callbacks.onMarketUpdate(data);
      }
    };

    // Add listeners
    this.socket.on('odds_update', oddsListener);
    this.socket.on('fancy_update', fancyListener);
    this.socket.on('score_update', scoreListener);
    this.socket.on('status_update', statusListener);
    this.socket.on('market_update', marketListener);

    // Return cleanup function
    return () => {
      console.log(`🔌 [WEBSOCKET] Unsubscribing from optimized updates for match: ${matchId}`);
      this.socket?.off('odds_update', oddsListener);
      this.socket?.off('fancy_update', fancyListener);
      this.socket?.off('score_update', scoreListener);
      this.socket?.off('status_update', statusListener);
      this.socket?.off('market_update', marketListener);
      this.socket?.emit('unsubscribe_match', { matchId });
    };
  }
}

export const websocketService = new WebSocketService();