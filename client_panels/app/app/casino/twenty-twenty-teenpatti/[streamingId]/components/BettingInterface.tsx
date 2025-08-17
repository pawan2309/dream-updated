'use client'

import { useState, useEffect } from 'react'
import { useGameState } from '../context/GameContext'

export default function BettingInterface() {
  const { gameState, actions } = useGameState()
  const [stakeInput, setStakeInput] = useState('')
  const [potentialWinnings, setPotentialWinnings] = useState({ A: 0, B: 0 })

  // Calculate potential winnings when stake or odds change
  useEffect(() => {
    const stake = parseFloat(stakeInput) || 0
    setPotentialWinnings({
      A: stake * gameState.playerAOdds,
      B: stake * gameState.playerBOdds
    })
  }, [stakeInput, gameState.playerAOdds, gameState.playerBOdds])

  const handleStakeChange = (value: string) => {
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setStakeInput(value)
      actions.setCurrentStake(value)
    }
  }

  const handlePlayerSelect = (player: 'A' | 'B') => {
    actions.setSelectedPlayer(player)
  }

  const handlePlaceBet = async () => {
    const stake = parseFloat(stakeInput)
    if (!stake || stake <= 0) return
    if (!gameState.selectedPlayer) return
    if (stake > gameState.userBalance) return
    if (!gameState.isBettingOpen) return

    try {
      // Call real betting API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001'}/externalapi/casino/bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          streamingId: gameState.streamingId,
          roundId: gameState.roundId,
          player: gameState.selectedPlayer,
          amount: stake,
          gameType: 'Teen20'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          actions.placeBet(stake, gameState.selectedPlayer)
          setStakeInput('')
          // Refresh balance after successful bet
          actions.fetchUserBalance()
        } else {
          console.error('Bet placement failed:', data.error)
          alert(`Bet failed: ${data.error}`)
        }
      } else {
        console.error('Bet API error:', response.status)
        alert('Failed to place bet. Please try again.')
      }
    } catch (error) {
      console.error('Error placing bet:', error)
      alert('Network error. Please try again.')
    }
  }

  const isBetDisabled = () => {
    return !gameState.isBettingOpen || 
           !gameState.selectedPlayer || 
           !stakeInput || 
           parseFloat(stakeInput) <= 0 || 
           parseFloat(stakeInput) > gameState.userBalance ||
           gameState.betPlaced
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Game Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">20-20 TEENPATTI</h2>
        <p className="text-gray-600">Round ID: {gameState.roundId || 'Loading...'}</p>
      </div>

      {/* Player Cards Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Player A */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">PLAYER A</h3>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3].map((card) => (
              <div key={card} className="w-16 h-24 bg-amber-800 rounded-lg border-2 border-amber-600 flex items-center justify-center">
                <span className="text-amber-200 text-xs">Card {card}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Player B */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">PLAYER B</h3>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3].map((card) => (
              <div key={card} className="w-16 h-24 bg-amber-800 rounded-lg border-2 border-amber-600 flex items-center justify-center">
                <span className="text-amber-200 text-xs">Card {card}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Betting Table */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="bg-blue-600 text-white py-2 px-4 rounded-t-lg font-semibold">
              LAGAI
            </div>
            <div className="bg-blue-500 text-white py-2 px-4 rounded-b-lg">
              ODDS
            </div>
          </div>
          
          {/* Player A Row */}
          <div className="text-center">
            <div className="bg-gray-300 text-gray-700 py-2 px-4 rounded-t-lg font-semibold">
              PLAYER A
            </div>
            <div className="bg-blue-400 text-white py-2 px-4 rounded-b-lg font-bold">
              {gameState.playerAOdds || '1.97'}
            </div>
          </div>

          {/* Player B Row */}
          <div className="text-center">
            <div className="bg-gray-300 text-gray-700 py-2 px-4 rounded-t-lg font-semibold">
              PLAYER B
            </div>
            <div className="bg-blue-400 text-white py-2 px-4 rounded-b-lg font-bold">
              {gameState.playerBOdds || '1.97'}
            </div>
          </div>
        </div>
      </div>

      {/* Betting Interface */}
      <div className="space-y-4">
        {/* Player Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handlePlayerSelect('A')}
            className={`py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
              gameState.selectedPlayer === 'A'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            PLAYER A
          </button>
          <button
            onClick={() => handlePlayerSelect('B')}
            className={`py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
              gameState.selectedPlayer === 'B'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            PLAYER B
          </button>
        </div>

        {/* Stake Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Stake Amount
          </label>
          <input
            type="text"
            value={stakeInput}
            onChange={(e) => handleStakeChange(e.target.value)}
            placeholder="Enter stake amount"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Potential Winnings */}
        {gameState.selectedPlayer && stakeInput && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Potential Winnings:</p>
            <p className="text-lg font-bold text-blue-600">
              ₹{potentialWinnings[gameState.selectedPlayer].toFixed(2)}
            </p>
          </div>
        )}

        {/* Place Bet Button */}
        <button
          onClick={handlePlaceBet}
          disabled={isBetDisabled()}
          className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
            isBetDisabled()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {gameState.betPlaced ? 'Bet Placed!' : 'Place Bet'}
        </button>
      </div>

      {/* Game Status */}
      <div className="mt-6 text-center">
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
          gameState.isBettingOpen
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {gameState.isBettingOpen ? 'Betting Open' : 'Betting Closed'}
        </div>
      </div>
    </div>
  )
}
