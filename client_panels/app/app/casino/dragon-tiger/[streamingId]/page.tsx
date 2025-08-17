'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '../../../../../components/Header'

interface GameState {
  roundId: string
  timeLeft: number
  isBettingOpen: boolean
  selectedOption: 'dragon' | 'tie' | 'tiger' | null
  stakeAmount: string
  userBalance: number
  betPlaced: boolean
}

export default function DragonTigerGame(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const streamingId = params.streamingId as string

  const [gameState, setGameState] = useState<GameState>({
    roundId: '116250817072030',
    timeLeft: 30,
    isBettingOpen: true,
    selectedOption: null,
    stakeAmount: '',
    userBalance: 10000,
    betPlaced: false
  })

  const [lastResults, setLastResults] = useState([
    { result: 'D', color: 'green' },
    { result: 'T', color: 'green' },
    { result: 'T', color: 'green' },
    { result: 'T', color: 'green' },
    { result: 'T', color: 'green' },
    { result: 'D', color: 'green' },
    { result: 'T', color: 'green' },
    { result: 'T', color: 'green' },
    { result: 'D', color: 'green' }
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

  const handleOptionSelect = (option: 'dragon' | 'tie' | 'tiger') => {
    if (!gameState.isBettingOpen || gameState.betPlaced) return
    setGameState(prev => ({ ...prev, selectedOption: option }))
  }

  const handleStakeChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setGameState(prev => ({ ...prev, stakeAmount: value }))
    }
  }

  const handlePlaceBet = () => {
    if (!gameState.selectedOption || !gameState.stakeAmount || gameState.betPlaced) return
    
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
          <h1 className="text-2xl font-bold">20-20 DRAGON TIGER</h1>
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
              {/* Card Backs */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 space-y-2">
                <div className="w-16 h-24 bg-amber-800 rounded-lg border-2 border-amber-600"></div>
                <div className="w-16 h-24 bg-amber-800 rounded-lg border-2 border-amber-600"></div>
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
            {/* Dragon */}
            <div className="bg-teal-500 text-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">1.95</div>
              <div className="text-lg font-semibold mb-2">DRAGON</div>
              <div className="text-sm opacity-80">0</div>
              <button
                onClick={() => handleOptionSelect('dragon')}
                disabled={!gameState.isBettingOpen || gameState.betPlaced}
                className={`w-full mt-2 py-2 rounded-lg font-semibold transition-all ${
                  gameState.selectedOption === 'dragon'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-teal-600 hover:bg-teal-700'
                } ${(!gameState.isBettingOpen || gameState.betPlaced) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Select Dragon
              </button>
            </div>

            {/* Tie */}
            <div className="bg-teal-500 text-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">49.95</div>
              <div className="text-lg font-semibold mb-2">TIE</div>
              <div className="text-sm opacity-80">0</div>
              <button
                onClick={() => handleOptionSelect('tie')}
                disabled={!gameState.isBettingOpen || gameState.betPlaced}
                className={`w-full mt-2 py-2 rounded-lg font-semibold transition-all ${
                  gameState.selectedOption === 'tie'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-teal-600 hover:bg-teal-700'
                } ${(!gameState.isBettingOpen || gameState.betPlaced) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Select Tie
              </button>
            </div>

            {/* Tiger */}
            <div className="bg-teal-500 text-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">1.95</div>
              <div className="text-lg font-semibold mb-2">TIGER</div>
              <div className="text-sm opacity-80">0</div>
              <button
                onClick={() => handleOptionSelect('tiger')}
                disabled={!gameState.isBettingOpen || gameState.betPlaced}
                className={`w-full mt-2 py-2 rounded-lg font-semibold transition-all ${
                  gameState.selectedOption === 'tiger'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-teal-600 hover:bg-teal-700'
                } ${(!gameState.isBettingOpen || gameState.betPlaced) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Select Tiger
              </button>
            </div>

            {/* Stake Input */}
            {gameState.selectedOption && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stake Amount
                </label>
                <input
                  type="text"
                  value={gameState.stakeAmount}
                  onChange={(e) => handleStakeChange(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
          <div className="bg-purple-600 text-white py-3 px-6 rounded-t-lg">
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
              <span className="font-semibold">D</span> = Dragon, <span className="font-semibold">T</span> = Tiger
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
