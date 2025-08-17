'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '../../../../../components/Header'

interface GameState {
  roundId: string
  timeLeft: number
  isBettingOpen: boolean
  selectedPlayer: 'amar' | 'akbar' | 'anthony' | null
  selectedOption: string | null
  stakeAmount: string
  userBalance: number
  betPlaced: boolean
}

export default function AAAGame(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const streamingId = params.streamingId as string

  const [gameState, setGameState] = useState<GameState>({
    roundId: '',
    timeLeft: 0,
    isBettingOpen: false,
    selectedPlayer: null,
    selectedOption: null,
    stakeAmount: '',
    userBalance: 0,
    betPlaced: false
  })

  const [lastResults, setLastResults] = useState<string[]>([])

  useEffect(() => {
    if (!streamingId) return

    // Fetch game data from API
    const fetchGameData = async () => {
      try {
        const response = await fetch(`/api/casino/aaa/${streamingId}`)
        if (response.ok) {
          const data = await response.json()
          setGameState(prev => ({
            ...prev,
            roundId: data.roundId || '',
            timeLeft: data.timeLeft || 0,
            isBettingOpen: data.isBettingOpen || false,
            userBalance: data.userBalance || 0
          }))
          setLastResults(data.lastResults || [])
        }
      } catch (error) {
        console.error('Error fetching game data:', error)
      }
    }

    fetchGameData()

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

  const handlePlayerSelect = (player: 'amar' | 'akbar' | 'anthony') => {
    if (!gameState.isBettingOpen || gameState.betPlaced) return
    setGameState(prev => ({ ...prev, selectedPlayer: player }))
  }

  const handleOptionSelect = (option: string) => {
    if (!gameState.isBettingOpen || gameState.betPlaced) return
    setGameState(prev => ({ ...prev, selectedOption: option }))
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

    setGameState(prev => ({
      ...prev,
      betPlaced: true,
      userBalance: prev.userBalance - stake
    }))
  }

  if (!streamingId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Invalid Game ID</h1>
          <p className="text-red-600">Game ID not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBackToCasino}
              className="flex items-center space-x-2 text-white hover:text-orange-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold">BACK TO CASINO</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                <span className="text-white text-sm font-medium">
                  Balance: ₹{gameState.userBalance.toLocaleString()}
                </span>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                <span className="text-white text-sm font-medium">
                  {gameState.isBettingOpen ? '🎯 BETTING OPEN' : '⏸️ BETTING CLOSED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Title Bar */}
      <div className="bg-green-800 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">AMAR AKBAR ANTHONY</h1>
          <div className="flex items-center space-x-2">
            <span className="text-xs">ROUND ID: {gameState.roundId || 'Loading...'}</span>
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-800 text-xs">i</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded p-4 relative h-64">
              {/* Player A Card */}
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <div className="w-12 h-16 bg-amber-800 rounded border border-amber-600"></div>
              </div>

              {/* Video Stream Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gray-200 w-full h-full rounded flex items-center justify-center relative">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 relative">
                      <div className="absolute inset-0 bg-white rounded shadow flex items-center justify-center">
                        <div className="text-gray-400 text-2xl">📄</div>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                        <div className="absolute inset-0 w-4 h-4 border-2 border-white rounded-full transform rotate-45"></div>
                      </div>
                    </div>
                    <div className="text-red-600 font-semibold text-sm">
                      Video stream unavailable
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="absolute bottom-2 right-2">
                <div className="bg-black text-white px-3 py-1 rounded font-mono text-xl font-bold">
                  {gameState.timeLeft.toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Betting Options */}
          <div className="space-y-3">
            {/* Player Selection */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePlayerSelect('amar')}
                disabled={!gameState.isBettingOpen || gameState.betPlaced}
                className={`p-2 rounded text-center font-semibold text-xs transition-all ${
                  gameState.selectedPlayer === 'amar'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } ${(!gameState.isBettingOpen || gameState.betPlaced) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                AMAR
              </button>
              <button
                onClick={() => handlePlayerSelect('akbar')}
                disabled={!gameState.isBettingOpen || gameState.betPlaced}
                className={`p-2 rounded text-center font-semibold text-xs transition-all ${
                  gameState.selectedPlayer === 'akbar'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } ${(!gameState.isBettingOpen || gameState.betPlaced) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                AKBAR
              </button>
              <button
                onClick={() => handlePlayerSelect('anthony')}
                disabled={!gameState.isBettingOpen || gameState.betPlaced}
                className={`p-2 rounded text-center font-semibold text-xs transition-all ${
                  gameState.selectedPlayer === 'anthony'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } ${(!gameState.isBettingOpen || gameState.betPlaced) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ANTHONY
              </button>
            </div>

            {/* Betting Options Grid */}
            {gameState.selectedPlayer && (
              <div className="bg-white p-3 rounded shadow">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => handleOptionSelect('even')}
                    className={`p-2 rounded text-xs font-semibold ${
                      gameState.selectedOption === 'even'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    EVEN
                  </button>
                  <button
                    onClick={() => handleOptionSelect('odd')}
                    className={`p-2 rounded text-xs font-semibold ${
                      gameState.selectedOption === 'odd'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ODD
                  </button>
                  <button
                    onClick={() => handleOptionSelect('red')}
                    className={`p-2 rounded text-xs font-semibold ${
                      gameState.selectedOption === 'red'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    RED
                  </button>
                  <button
                    onClick={() => handleOptionSelect('black')}
                    className={`p-2 rounded text-xs font-semibold ${
                      gameState.selectedOption === 'black'
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    BLACK
                  </button>
                </div>

                {/* Card Grid A-K */}
                <div className="grid grid-cols-4 gap-1 mb-3">
                  {['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map((card) => (
                    <button
                      key={card}
                      onClick={() => handleOptionSelect(`card_${card}`)}
                      className={`p-1 rounded text-xs font-semibold ${
                        gameState.selectedOption === `card_${card}`
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {card}
                    </button>
                  ))}
                </div>

                {/* Stake Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Stake Amount
                  </label>
                  <input
                    type="text"
                    value={gameState.stakeAmount}
                    onChange={(e) => handleStakeChange(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handlePlaceBet}
                    disabled={!gameState.stakeAmount || gameState.betPlaced}
                    className="w-full py-1 bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    {gameState.betPlaced ? 'Bet Placed!' : 'Place Bet'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Last Results Section */}
        <div className="mt-4">
          <div className="bg-green-600 text-white py-2 px-4 rounded-t">
            <h3 className="text-sm font-semibold">Last Result</h3>
          </div>
          <div className="bg-white p-4 rounded-b shadow">
            <div className="flex justify-center space-x-2">
              {lastResults.slice(0, 10).map((result, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-green-500"
                >
                  {result}
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-gray-600">
              <span className="font-semibold">A</span> = Amar, <span className="font-semibold">K</span> = Akbar, <span className="font-semibold">N</span> = Anthony
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
