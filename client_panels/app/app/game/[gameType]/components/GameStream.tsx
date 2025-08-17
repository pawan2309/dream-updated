'use client'

import React from 'react'

interface GameStreamProps {
  gameType: string
  isBettingOpen: boolean
  roundStatus: string
}

const GameStream = React.memo(function GameStream({ 
  gameType, 
  isBettingOpen, 
  roundStatus 
}: GameStreamProps) {
  const getGameIcon = (gameType: string) => {
    const iconMap: Record<string, string> = {
      teenpatti: '🃏',
      dragontiger: '🐉',
      andarbahar: '⬅️➡️',
      lucky7: '🎯',
      thirtytwocard: '🃏',
      aaa: '👥',
    }
    return iconMap[gameType] || '🎮'
  }

  const getStatusMessage = () => {
    if (roundStatus === 'waiting') return 'Waiting for round to start...'
    if (roundStatus === 'betting') return 'Betting is now open!'
    if (roundStatus === 'active') return 'Round in progress...'
    if (roundStatus === 'ended') return 'Round ended'
    return 'Game status unknown'
  }

  const getStatusColor = () => {
    if (roundStatus === 'betting') return 'text-green-600'
    if (roundStatus === 'active') return 'text-red-600'
    if (roundStatus === 'ended') return 'text-gray-600'
    return 'text-blue-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Stream Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Game Stream</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">LIVE</span>
          </div>
        </div>
      </div>
      
      {/* Stream Content */}
      <div className="relative bg-black aspect-video">
        {/* Placeholder Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            {/* Game Icon */}
            <div className="text-6xl mb-4">
              {getGameIcon(gameType)}
            </div>
            
            {/* Status Message */}
            <div className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
              {getStatusMessage()}
            </div>
            
            {/* Game Type */}
            <div className="text-lg text-gray-300 mb-4">
              {gameType.charAt(0).toUpperCase() + gameType.slice(1).replace(/([A-Z])/g, ' $1')}
            </div>
            
            {/* Betting Status */}
            {isBettingOpen && (
              <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
                🎯 Betting Open
              </div>
            )}
            
            {/* Round Status */}
            <div className="mt-4 text-sm text-gray-400">
              Round Status: <span className="font-semibold">{roundStatus.toUpperCase()}</span>
            </div>
          </div>
        </div>
        
        {/* Overlay Elements */}
        {roundStatus === 'betting' && (
          <>
            {/* Betting Timer Overlay */}
            <div className="absolute top-4 right-4">
              <div className="bg-red-600 text-white px-3 py-1 rounded-lg font-mono text-lg font-bold border-2 border-red-400">
                ⏰
              </div>
            </div>
            
            {/* Betting Indicator */}
            <div className="absolute bottom-4 left-4">
              <div className="bg-green-600 text-white px-3 py-2 rounded-lg font-semibold animate-bounce">
                🎯 Place Your Bets!
              </div>
            </div>
          </>
        )}
        
        {roundStatus === 'active' && (
          <div className="absolute top-4 left-4">
            <div className="bg-orange-600 text-white px-3 py-2 rounded-lg font-semibold">
              ⚡ Round Active
            </div>
          </div>
        )}
        
        {roundStatus === 'ended' && (
          <div className="absolute top-4 left-4">
            <div className="bg-gray-600 text-white px-3 py-2 rounded-lg font-semibold">
              🏁 Round Ended
            </div>
          </div>
        )}
      </div>
      
      {/* Stream Footer */}
      <div className="bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Stream ID: {Date.now().toString().slice(-8)}</span>
          <span>Quality: HD</span>
        </div>
      </div>
    </div>
  )
})

export default GameStream
