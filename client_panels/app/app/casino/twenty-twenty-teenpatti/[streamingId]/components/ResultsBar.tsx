'use client'

import { useGameState } from '../context/GameContext'

export default function ResultsBar() {
  const { gameState } = useGameState()

  // Mock results data - replace with actual API data
  const lastResults = [
    { result: 'B', color: 'green' },
    { result: 'A', color: 'red' },
    { result: 'B', color: 'green' },
    { result: 'B', color: 'green' },
    { result: 'B', color: 'green' },
    { result: 'A', color: 'red' },
    { result: 'B', color: 'green' },
    { result: 'B', color: 'green' },
    { result: 'B', color: 'green' },
    { result: 'A', color: 'red' },
    { result: 'B', color: 'green' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Last Result Header */}
      <div className="bg-blue-600 text-white py-2 px-4 rounded-t-lg mb-4">
        <h3 className="text-lg font-semibold">Last Result</h3>
      </div>

      {/* Results Display */}
      <div className="flex justify-center space-x-2">
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

      {/* Result Legend */}
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span className="text-gray-700">Player B Wins</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-gray-700">Player A Wins</span>
        </div>
      </div>

      {/* Game Statistics */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {lastResults.filter(r => r.result === 'B').length}
          </div>
          <div className="text-sm text-gray-600">Player B Wins</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {lastResults.filter(r => r.result === 'A').length}
          </div>
          <div className="text-sm text-gray-600">Player A Wins</div>
        </div>
      </div>
    </div>
  )
}
