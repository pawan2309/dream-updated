'use client'

import React, { memo, useState } from 'react'
import { useBetSlip } from '../context/BetSlipContext'
import { GAME_CONFIG } from '../config/gameConfig'

const BetSlip = memo(function BetSlip() {
  const { 
    state: betSlipState, 
    removeBet, 
    updateStake, 
    updateCurrentStake, 
    clearBets, 
    placeBets,
    toggleBetSlip 
  } = useBetSlip()
  
  const [isPlacing, setIsPlacing] = useState(false)

  const handleStakeChange = (betId: string, newStake: string) => {
    const stake = parseFloat(newStake)
    if (!isNaN(stake)) {
      updateStake(betId, stake)
    }
  }

  const handlePlaceBets = async () => {
    if (betSlipState.selectedBets.length === 0) return
    
    setIsPlacing(true)
    try {
      const success = await placeBets()
      if (success) {
        console.log('Bets placed successfully!')
      }
    } catch (error) {
      console.error('Failed to place bets:', error)
    } finally {
      setIsPlacing(false)
    }
  }

  const handleQuickStake = (stake: number) => {
    updateCurrentStake(stake.toString())
    betSlipState.selectedBets.forEach(bet => {
      updateStake(bet.id, stake)
    })
  }

  if (betSlipState.selectedBets.length === 0) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📋</div>
          <p className="text-sm">No bets selected</p>
          <p className="text-xs">Click on odds to add bets to your slip</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* Bet Slip Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Bet Slip</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm bg-blue-500 px-2 py-1 rounded-full">
              {betSlipState.selectedBets.length} {betSlipState.selectedBets.length === 1 ? 'Bet' : 'Bets'}
            </span>
            <button
              onClick={toggleBetSlip}
              className="text-blue-200 hover:text-white transition-colors"
            >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6 M6 6l12 12" />
               </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Bets */}
      <div className="max-h-64 overflow-y-auto">
        {betSlipState.selectedBets.map((bet) => (
          <div key={bet.id} className="border-b border-gray-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{bet.selectionName}</div>
                <div className="text-xs text-gray-500">{bet.marketName}</div>
              </div>
              <button
                onClick={() => removeBet(bet.id)}
                className="text-red-500 hover:text-red-700 transition-colors ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6 M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-center">
                <div className="text-xs text-gray-500">Odds</div>
                <div className="text-sm font-bold text-blue-600">{bet.odds.toFixed(2)}</div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-500">Stake</div>
                <input
                  type="number"
                  value={bet.stake}
                  onChange={(e) => handleStakeChange(bet.id, e.target.value)}
                  className="w-full text-center text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={GAME_CONFIG.BETTING.MIN_STAKE}
                  max={GAME_CONFIG.BETTING.MAX_STAKE}
                />
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-500">Profit</div>
                <div className="text-sm font-bold text-green-600">₹{bet.potentialProfit.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stake Buttons */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-xs text-gray-500 mb-2">Quick Stake</div>
        <div className="grid grid-cols-4 gap-2">
          {GAME_CONFIG.BETTING.STAKE_STEPS.slice(0, 4).map((stake) => (
            <button
              key={stake}
              onClick={() => handleQuickStake(stake)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
            >
              ₹{stake.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Summary */}
      <div className="p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">Total Stake:</span>
          <span className="text-lg font-bold text-gray-800">₹{betSlipState.totalStake.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">Potential Profit:</span>
          <span className="text-lg font-bold text-green-600">₹{betSlipState.totalPotentialProfit.toFixed(2)}</span>
        </div>
        
        {/* Error Display */}
        {betSlipState.error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
            {betSlipState.error}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={clearBets}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handlePlaceBets}
            disabled={isPlacing || betSlipState.selectedBets.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlacing ? 'Placing...' : 'Place Bets'}
          </button>
        </div>
      </div>
    </div>
  )
})

export default BetSlip
