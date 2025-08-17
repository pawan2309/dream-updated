interface WebSocketServiceConfig {
  url: string;
  autoConnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketServiceConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor(config: WebSocketServiceConfig) {
    this.config = config;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.reconnectDelay = config.reconnectDelay || 1000;
    
    if (config.autoConnect !== false) {
      this.connect();
    }
  }

  connect() {
    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };

      this.ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(message: any) {
    const listeners = this.listeners.get(message.type) || [];
    listeners.forEach(callback => callback(message.data));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  emit(event: string, data?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, data }));
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string) {
    this.listeners.delete(event);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
} 