'use client'

import Header from '../../../components/Header'
import { useEffect, useState } from 'react'
import { useInPlayMatches } from '../../../lib/hooks/useInPlayMatches'

import { LiveMatchList } from '../../../components/LiveMatchList'
import { useRouter } from 'next/navigation'
import { websocketService } from '../../../lib/websocketService'

export default function InPlay() {
  const router = useRouter()
  const {
    matches,
    loading,
    error,
    connectionStatus,
    lastUpdate,
    refreshMatches,
    subscribeToMatch,
    unsubscribeFromMatch
  } = useInPlayMatches()

  // State for WebSocket connection status
  const [isConnecting, setIsConnecting] = useState(false);

  // Make WebSocket service globally accessible for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).websocketService = websocketService;
      console.log('🔌 WebSocket service made globally accessible');
    }
  }, []);

  // Auto-connect WebSocket when component mounts
  useEffect(() => {
    console.log('🚀 InPlay page mounted - starting automatic WebSocket connection...');
    
    const connectWebSocket = async () => {
      try {
        setIsConnecting(true);
        console.log('🔌 Auto-connecting WebSocket on page load...');
        
        // Immediate connection attempt
        const success = await websocketService.authenticate();
        
        if (success) {
          console.log('✅ WebSocket auto-connection successful');
        } else {
          console.log('⚠️ WebSocket auto-connection failed, retrying in 2 seconds...');
          
          // Retry after 2 seconds if initial connection fails
          setTimeout(async () => {
            console.log('🔄 Retrying WebSocket connection...');
            const retrySuccess = await websocketService.authenticate();
            if (retrySuccess) {
              console.log('✅ WebSocket retry connection successful');
            } else {
              console.log('❌ WebSocket retry connection failed');
            }
          }, 2000);
        }
      } catch (error) {
        console.error('❌ WebSocket auto-connection error:', error);
        
        // Retry on error after 3 seconds
        setTimeout(async () => {
          console.log('🔄 Retrying WebSocket connection after error...');
          try {
            await websocketService.authenticate();
          } catch (retryError) {
            console.error('❌ WebSocket retry after error failed:', retryError);
          }
        }, 3000);
      } finally {
        setIsConnecting(false);
      }
    };

    // Connect immediately when component mounts
    connectWebSocket();

    // Set up connection status listener
    const handleConnected = () => {
      console.log('🎉 WebSocket connected event received');
      setIsConnecting(false);
    };

    const handleDisconnected = () => {
      console.log('🔌 WebSocket disconnected event received');
      
      // Auto-reconnect if disconnected
      setTimeout(async () => {
        console.log('🔄 Auto-reconnecting WebSocket after disconnect...');
        setIsConnecting(true);
        try {
          await websocketService.authenticate();
        } catch (error) {
          console.error('❌ Auto-reconnection failed:', error);
          setIsConnecting(false);
        }
      }, 2000);
    };

    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);

    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-gray-50 relative pt-[72px]">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Cricket Matches
                  {isConnecting && (
                    <span className="ml-2 text-sm font-normal text-yellow-600">
                      (Connecting to live updates...)
                    </span>
                  )}
                </h1>
                
              </div>
              
              {/* Connection Status Badge */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isConnecting ? 'bg-yellow-500' : 
                    websocketService.getConnectionStatus() ? 'bg-green-500' : 'bg-red-500'
                  } ${isConnecting ? 'animate-pulse' : ''}`} />
                  <span className={`text-sm font-medium ${
                    isConnecting ? 'text-yellow-700' : 
                    websocketService.getConnectionStatus() ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {isConnecting ? 'Connecting...' : 
                     websocketService.getConnectionStatus() ? 'Live Updates' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>



          {/* Matches List */}
          <LiveMatchList
            matches={matches}
            loading={loading}
            error={error}
            emptyMessage="No in-play matches available at the moment. Check back later for live matches."
          />

          {/* WebSocket Test Results */}
          {/* The test results section is removed as per the edit hint. */}

          {/* Connection Status Footer */}
          {!connectionStatus && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">WebSocket Connection Lost</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Real-time updates are currently unavailable. The page will automatically reconnect when the connection is restored.
                  </p>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  )
} 