'use client'

import React, { memo } from 'react'
import { useBetSlip } from '../context/BetSlipContext'
import { GAME_CONFIG } from '../config/gameConfig'

interface Market {
  id: string
  name: string
  type: string
  options: Array<{
    id: string
    name: string
    odds: number
    color: string
  }>
}

interface BettingMarketsProps {
  gameType: string
  markets: Market[]
  isBettingOpen: boolean
  isMobile: boolean
}

const BettingMarkets = memo(function BettingMarkets({ 
  gameType, 
  markets, 
  isBettingOpen, 
  isMobile 
}: BettingMarketsProps) {
  const { addBet, state: betSlipState } = useBetSlip()

  const handleBetSelection = (market: Market, option: Market['options'][0]) => {
    if (!isBettingOpen) return

    addBet({
      id: `${market.id}_${option.id}`,
      marketId: market.id,
      marketName: market.name,
      selectionName: option.name,
      odds: option.odds,
    })
  }

  const isBetSelected = (marketId: string, optionId: string) => {
    return betSlipState.selectedBets.some(bet => bet.id === `${marketId}_${optionId}`)
  }

  const getColorClasses = (color: string, isSelected: boolean, isDisabled: boolean) => {
    if (isDisabled) return 'bg-gray-300 text-gray-500 cursor-not-allowed'
    if (isSelected) return 'bg-yellow-400 text-black shadow-lg transform scale-105'
    
    const colorMap: Record<string, string> = {
      red: 'bg-red-500 hover:bg-red-600 text-white',
      blue: 'bg-blue-500 hover:bg-blue-600 text-white',
      green: 'bg-green-500 hover:bg-green-600 text-white',
      purple: 'bg-purple-500 hover:bg-purple-600 text-white',
      orange: 'bg-orange-500 hover:bg-orange-600 text-white',
      teal: 'bg-teal-500 hover:bg-teal-600 text-white',
      black: 'bg-gray-800 hover:bg-gray-900 text-white',
    }
    
    return colorMap[color] || 'bg-gray-500 hover:bg-gray-600 text-white'
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-500">No betting markets available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {markets.map((market) => (
        <div key={market.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Market Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
            <h3 className="text-lg font-semibold">{market.name}</h3>
          </div>
          
          {/* Market Options */}
          <div className="p-4">
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
              {market.options.map((option) => {
                const isSelected = isBetSelected(market.id, option.id)
                const isDisabled = !isBettingOpen
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleBetSelection(market, option)}
                    disabled={isDisabled}
                    className={`
                      ${getColorClasses(option.color, isSelected, isDisabled)}
                      ${GAME_CONFIG.UI.ODDS_BUTTON_HEIGHT}
                      rounded-lg font-semibold transition-all duration-300
                      flex flex-col items-center justify-center
                      ${!isDisabled && !isSelected ? 'hover:shadow-lg hover:scale-105' : ''}
                      ${isSelected ? 'ring-2 ring-yellow-300 ring-offset-2' : ''}
                    `}
                  >
                    {/* Selection Name */}
                    <div className="text-sm font-medium mb-1">
                      {option.name}
                    </div>
                    
                    {/* Odds */}
                    <div className="text-lg font-bold">
                      {option.odds.toFixed(2)}
                    </div>
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <div className="w-4 h-4 bg-yellow-300 rounded-full flex items-center justify-center">
                          <span className="text-xs text-black">✓</span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ))}
      
      {/* Betting Status */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isBettingOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className={`text-sm font-medium ${isBettingOpen ? 'text-green-700' : 'text-red-700'}`}>
              {isBettingOpen ? '🎯 Betting Open' : '⏸️ Betting Closed'}
            </span>
          </div>
          
          {betSlipState.selectedBets.length > 0 && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {betSlipState.selectedBets.length} {betSlipState.selectedBets.length === 1 ? 'Bet' : 'Bets'} Selected
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Stake Input */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Stake</h4>
        <div className="grid grid-cols-3 gap-2">
          {GAME_CONFIG.BETTING.STAKE_STEPS.slice(0, 6).map((stake) => (
            <button
              key={stake}
              onClick={() => {/* Update current stake */}}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              ₹{stake.toLocaleString()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default BettingMarkets
