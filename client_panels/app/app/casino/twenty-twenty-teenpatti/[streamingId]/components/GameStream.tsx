'use client'

import { useGameState } from '../context/GameContext'

export default function GameStream() {
  const { gameState } = useGameState()

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Game Stream Container */}
      <div className="relative bg-gray-200 h-96">
        {/* Video Stream Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Error Icon */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              {/* Document Icon */}
              <div className="absolute inset-0 bg-white rounded-lg shadow-lg flex items-center justify-center">
                <div className="text-gray-400 text-4xl">📄</div>
              </div>
              {/* Red Circle with Slash */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white rounded-full"></div>
                <div className="absolute inset-0 w-6 h-6 border-2 border-white rounded-full transform rotate-45"></div>
              </div>
            </div>
            
            {/* Error Message */}
            <div className="text-red-600 font-semibold text-lg">
              casinostream.trovetown.co refused to connect.
            </div>
            <div className="text-gray-500 text-sm mt-2">
              Video stream is currently unavailable
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="absolute bottom-4 right-4">
          <div className="bg-black text-white px-4 py-2 rounded-lg font-mono text-2xl font-bold">
            {gameState.timeLeft ? gameState.timeLeft.toString().padStart(2, '0') : '00'}
          </div>
        </div>

        {/* Game Status Overlay */}
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            gameState.isBettingOpen 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {gameState.isBettingOpen ? 'BETTING OPEN' : 'BETTING CLOSED'}
          </div>
        </div>

        {/* Round Info Overlay */}
        <div className="absolute top-4 right-4">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
            Round: {gameState.roundId || 'Loading...'}
          </div>
        </div>
      </div>

      {/* Stream Controls */}
      <div className="bg-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Refresh Stream
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Fullscreen
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            Stream Quality: <span className="font-semibold">HD</span>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <strong>Connection Issue:</strong> Unable to establish connection with casino stream server.
            </p>
            <p className="text-xs text-red-600 mt-1">
              Please check your internet connection or try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
