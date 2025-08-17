'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '../../../../../components/Header'

interface GameState {
  roundId: string
  timeLeft: number
  isBettingOpen: boolean
  selectedPlayer: number | null
  selectedOption: 'back' | 'lay' | null
  stakeAmount: string
  userBalance: number
  betPlaced: boolean
}

export default function ThirtyTwoCardGame(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const streamingId = params.streamingId as string

  const [gameState, setGameState] = useState<GameState>({
    roundId: '113250817072109',
    timeLeft: 30,
    isBettingOpen: true,
    selectedPlayer: null,
    selectedOption: null,
    stakeAmount: '',
    userBalance: 10000,
    betPlaced: false
  })

  const [playerCards, setPlayerCards] = useState([
    { player: 8, card: 'J♦', suit: 'diamonds' },
    { player: 9, card: '7♠', suit: 'spades' },
    { player: 10, card: '7♣', suit: 'clubs' },
    { player: 11, card: 'K♠', suit: 'spades' }
  ])

  const [lastResults, setLastResults] = useState([
    { result: '10', color: 'green' },
    { result: '10', color: 'green' },
    { result: '11', color: 'green' },
    { result: '11', color: 'green' },
    { result: '10', color: 'green' },
    { result: '9', color: 'green' },
    { result: '10', color: 'green' },
    { result: '10', color: 'green' },
    { result: '11', color: 'green' },
    { result: '11', color: 'green' }
  ])

  useEffect(() => {
    if (!streamingId) return

    // Countdown timer
    const timer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 1)
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [streamingId])

  const handleBackToCasino = () => {
    router.push('/app/casino')
  }

  const handlePlayerSelect = (player: number, option: 'back' | 'lay') => {
    if (!gameState.isBettingOpen || gameState.betPlaced) return
    setGameState(prev => ({ 
      ...prev, 
      selectedPlayer: player,
      selectedOption: option 
    }))
  }

  const handleStakeChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setGameState(prev => ({ ...prev, stakeAmount: value }))
    }
  }

  const handlePlaceBet = () => {
    if (!gameState.selectedPlayer || !gameState.selectedOption || !gameState.stakeAmount || gameState.betPlaced) return
    
    const stake = parseFloat(gameState.stakeAmount)
    if (stake <= 0 || stake > gameState.userBalance) return

    // Place bet logic here
    setGameState(prev => ({
      ...prev,
      betPlaced: true,
      userBalance: prev.userBalance - stake
    }))
  }

  if (!streamingId) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-red-50 via-red-100 to-red-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Invalid Game ID</h1>
          <p className="text-red-600">Game ID not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative pt-[60px]">
      <Header />
      
      {/* Top Header - Back to Casino */}
      <div className="bg-orange-500 text-white py-3 text-center">
        <button 
          onClick={handleBackToCasino}
          className="text-lg font-semibold hover:underline"
        >
          BACK TO CASINO LIST
        </button>
      </div>

      {/* Game Title Bar */}
      <div className="bg-blue-800 text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">32 CARD A</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm">ROUND ID: {gameState.roundId}</span>
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-800 text-xs">i</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg p-6 relative h-96">
              {/* Player Cards Panel */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 space-y-4">
                {playerCards.map((playerCard) => (
                  <div key={playerCard.player} className="text-white">
                    <div className="text-sm font-semibold mb-2">
                      PLAYER {playerCard.player}:
                    </div>
                    <div className={`w-20 h-28 rounded-lg border-2 flex items-center justify-center shadow-lg ${
                      playerCard.suit === 'diamonds' || playerCard.suit === 'hearts' 
                        ? 'bg-white text-red-600' 
                        : 'bg-white text-black'
                    }`}>
                      <div className="text-2xl font-bold">{playerCard.card}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Video Stream Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gray-200 w-full h-full rounded-lg flex items-center justify-center relative">
                  {/* Error Icon */}
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 relative">
                      <div className="absolute inset-0 bg-white rounded-lg shadow-lg flex items-center justify-center">
                        <div className="text-gray-400 text-4xl">📄</div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white rounded-full"></div>
                        <div className="absolute inset-0 w-6 h-6 border-2 border-white rounded-full transform rotate-45"></div>
                      </div>
                    </div>
                    <div className="text-red-600 font-semibold text-lg">
                      Video stream unavailable
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="absolute bottom-4 right-4">
                <div className="bg-black text-white px-4 py-2 rounded-lg font-mono text-2xl font-bold">
                  {gameState.timeLeft.toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Betting Options */}
          <div className="space-y-4">
            {/* Betting Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-600 text-white p-3">
                <div className="grid grid-cols-2 gap-4 text-center font-semibold">
                  <div>BACK</div>
                  <div>LAY</div>
                </div>
              </div>
              
              {/* Player Rows */}
              <div className="p-4 space-y-3">
                {playerCards.map((playerCard) => (
                  <div key={playerCard.player} className="grid grid-cols-2 gap-4">
                    {/* BACK Button */}
                    <button
                      onClick={() => handlePlayerSelect(playerCard.player, 'back')}
                      disabled={!gameState.isBettingOpen || gameState.betPlaced}
                      className={`p-3 rounded-lg text-center font-semibold transition-all ${
                        gameState.selectedPlayer === playerCard.player && gameState.selectedOption === 'back'
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                      } ${(!gameState.isBettingOpen || gameState.betPlaced) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-sm opacity-80">0.00</div>
                      <div className="text-xs">BACK</div>
                    </button>
                    
                    {/* LAY Button */}
                    <button
                      onClick={() => handlePlayerSelect(playerCard.player, 'lay')}
                      disabled={!gameState.isBettingOpen || gameState.betPlaced}
                      className={`p-3 rounded-lg text-center font-semibold transition-all ${
                        gameState.selectedPlayer === playerCard.player && gameState.selectedOption === 'lay'
                          ? 'bg-yellow-400 text-black'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      } ${(!gameState.isBettingOpen || gameState.betPlaced) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-sm opacity-80">0.00</div>
                      <div className="text-xs">LAY</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stake Input */}
            {gameState.selectedPlayer && gameState.selectedOption && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stake Amount for Player {gameState.selectedPlayer} ({gameState.selectedOption.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={gameState.stakeAmount}
                  onChange={(e) => handleStakeChange(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handlePlaceBet}
                  disabled={!gameState.stakeAmount || gameState.betPlaced}
                  className="w-full mt-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {gameState.betPlaced ? 'Bet Placed!' : 'Place Bet'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Last Results Section */}
        <div className="mt-8">
          <div className="bg-blue-600 text-white py-3 px-6 rounded-t-lg">
            <h3 className="text-lg font-semibold">Last Result</h3>
          </div>
          <div className="bg-white p-6 rounded-b-lg shadow-lg">
            <div className="flex justify-center space-x-3">
              {lastResults.map((result, index) => (
                <div
                  key={index}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    result.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {result.result}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              Numbers represent the winning Player (8, 9, 10, or 11)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
