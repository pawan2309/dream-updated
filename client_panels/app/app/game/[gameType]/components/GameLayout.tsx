'use client'

import React, { memo } from 'react'
import { useGame } from '../context/GameContext'
import { useBetSlip } from '../context/BetSlipContext'
import { GAME_CONFIG, GAME_MESSAGES } from '../config/gameConfig'
import GameHeader from './GameHeader'
import BettingMarkets from './BettingMarkets'
import GameStream from './GameStream'
import RoundInfo from './RoundInfo'
import LastResults from './LastResults'

interface GameLayoutProps {
  gameType: string
  gameData: any
  loading: boolean
  isMobile: boolean
  isTablet: boolean
}

const GameLayout = memo(function GameLayout({ 
  gameType, 
  gameData, 
  loading, 
  isMobile, 
  isTablet 
}: GameLayoutProps) {
  const { state: gameState } = useGame()
  const { state: betSlipState } = useBetSlip()
  
  const gameConfig = GAME_CONFIG.GAMES[gameType as keyof typeof GAME_CONFIG.GAMES]
  
  if (!gameConfig) {
    return (
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-600">Game not found</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4">
      <div className={`max-w-${GAME_CONFIG.UI.MAX_WIDTH} mx-auto`}>
        
        {/* Game Header */}
        <GameHeader 
          gameConfig={gameConfig}
          gameState={gameState}
          onBackToCasino={() => window.history.back()}
        />

        {/* Main Game Content */}
        <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'} gap-${GAME_CONFIG.UI.GRID_GAP} mt-6`}>
          
          {/* Left Column - Betting Markets */}
          <div className={`${isMobile ? 'order-2' : 'order-1'}`}>
            <BettingMarkets 
              gameType={gameType}
              markets={gameConfig.markets}
              isBettingOpen={gameState.isBettingOpen}
              isMobile={isMobile}
            />
          </div>
          
          {/* Center Column - Game Stream & Round Info */}
          <div className={`${isMobile ? 'order-1' : 'order-2'}`}>
            <div className="space-y-6">
              <GameStream 
                gameType={gameType}
                isBettingOpen={gameState.isBettingOpen}
                roundStatus={gameState.roundStatus}
              />
              
              <RoundInfo 
                roundId={gameState.roundId}
                timeLeft={gameState.timeLeft}
                isBettingOpen={gameState.isBettingOpen}
                roundStatus={gameState.roundStatus}
                connectionStatus={gameState.connectionStatus}
              />
            </div>
          </div>
          
          {/* Right Column - Last Results & Quick Actions */}
          <div className="order-3">
            <div className="space-y-6">
              <LastResults 
                results={gameState.lastResults}
                gameType={gameType}
              />
              
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => window.history.back()}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all duration-300"
                  >
                    ← Back to Casino
                  </button>
                  
                  {betSlipState.selectedBets.length > 0 && (
                    <button
                      onClick={() => {/* Toggle bet slip */}}
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-400 hover:to-green-500 transition-all duration-300"
                    >
                      📋 Bet Slip ({betSlipState.selectedBets.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default GameLayout
