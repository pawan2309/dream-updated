'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GAME_CONFIG } from '../config/gameConfig'

interface GameConfig {
  displayName: string
  description: string
  image: string
}

interface GameState {
  roundId: string
  timeLeft: number
  isBettingOpen: boolean
  roundStatus: string
  connectionStatus: string
}

interface GameHeaderProps {
  gameConfig: GameConfig
  gameState: GameState
  onBackToCasino: () => void
}

const GameHeader = React.memo(function GameHeader({ 
  gameConfig, 
  gameState, 
  onBackToCasino 
}: GameHeaderProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'betting': return 'text-green-600'
      case 'active': return 'text-red-600'
      case 'ended': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'betting': return '🎯'
      case 'active': return '⚡'
      case 'ended': return '🏁'
      default: return '⏳'
    }
  }

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getConnectionIcon = (status: string) => {
    switch (status) {
      case 'connected': return '🟢'
      case 'connecting': return '🟡'
      case 'error': return '🔴'
      default: return '⚪'
    }
  }

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Left Section - Back Button & Game Info */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToCasino}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Casino
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <img 
                  src={gameConfig.image} 
                  alt={gameConfig.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{gameConfig.displayName}</h1>
                <p className="text-sm text-gray-600">{gameConfig.description}</p>
              </div>
            </div>
          </div>
          
          {/* Right Section - Game Status */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Round ID */}
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium">Round ID</div>
              <div className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                {gameState.roundId}
              </div>
            </div>
            
            {/* Time Left */}
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium">Time Left</div>
              <div className={`text-lg font-bold ${gameState.isBettingOpen ? 'text-green-600' : 'text-red-600'}`}>
                {gameState.timeLeft.toString().padStart(2, '0')}s
              </div>
            </div>
            
            {/* Game Status */}
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium">Status</div>
              <div className={`text-sm font-semibold ${getStatusColor(gameState.roundStatus)}`}>
                {getStatusIcon(gameState.roundStatus)} {gameState.roundStatus.charAt(0).toUpperCase() + gameState.roundStatus.slice(1)}
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium">Connection</div>
              <div className={`text-sm font-semibold ${getConnectionColor(gameState.connectionStatus)}`}>
                {getConnectionIcon(gameState.connectionStatus)} {gameState.connectionStatus.charAt(0).toUpperCase() + gameState.connectionStatus.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default GameHeader
