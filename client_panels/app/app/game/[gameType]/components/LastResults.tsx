'use client'

import React from 'react'

interface LastResultsProps {
  results: string[]
  gameType: string
}

const LastResults = React.memo(function LastResults({ results, gameType }: LastResultsProps) {
  const getResultColor = (result: string) => {
    // Default colors for different game types
    const colorMap: Record<string, Record<string, string>> = {
      teenpatti: {
        'P1': 'bg-blue-500',
        'P2': 'bg-green-500',
        'P3': 'bg-purple-500',
        'P': 'bg-orange-500', // Pair
        'T': 'bg-red-500',    // Trail
        'H': 'bg-teal-500',   // High Card
      },
      dragontiger: {
        'D': 'bg-red-500',    // Dragon
        'T': 'bg-blue-500',   // Tiger
        'X': 'bg-purple-500', // Tie
      },
      andarbahar: {
        'A': 'bg-green-500',  // Andar
        'B': 'bg-blue-500',   // Bahar
      },
      lucky7: {
        'L': 'bg-blue-500',   // Low
        'H': 'bg-green-500',  // High
        '7': 'bg-red-500',    // Seven
      },
      thirtytwocard: {
        '8': 'bg-blue-500',
        '9': 'bg-green-500',
        '10': 'bg-purple-500',
        '11': 'bg-orange-500',
      },
      aaa: {
        'A': 'bg-red-500',    // Amar
        'K': 'bg-green-500',  // Akbar
        'N': 'bg-blue-500',   // Anthony
      }
    }
    
    return colorMap[gameType]?.[result] || 'bg-gray-500'
  }

  const getResultLabel = (result: string) => {
    const labelMap: Record<string, Record<string, string>> = {
      teenpatti: {
        'P1': 'P1',
        'P2': 'P2',
        'P3': 'P3',
        'P': 'Pair',
        'T': 'Trail',
        'H': 'High',
      },
      dragontiger: {
        'D': 'Dragon',
        'T': 'Tiger',
        'X': 'Tie',
      },
      andarbahar: {
        'A': 'Andar',
        'B': 'Bahar',
      },
      lucky7: {
        'L': 'Low',
        'H': 'High',
        '7': 'Seven',
      },
      thirtytwocard: {
        '8': '8',
        '9': '9',
        '10': '10',
        '11': '11',
      },
      aaa: {
        'A': 'Amar',
        'K': 'Akbar',
        'N': 'Anthony',
      }
    }
    
    return labelMap[gameType]?.[result] || result
  }

  // Generate sample results if none provided
  const displayResults = results.length > 0 ? results : [
    'P1', 'P2', 'P3', 'P', 'T', 'H', 'P1', 'P2', 'P3', 'P'
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Last Results</h3>
          <button className="text-blue-200 hover:text-white text-sm transition-colors">
            View All
          </button>
        </div>
      </div>
      
      {/* Results Grid */}
      <div className="p-4">
        <div className="grid grid-cols-5 gap-2">
          {displayResults.slice(0, 10).map((result, index) => (
            <div
              key={index}
              className={`${getResultColor(result)} text-white rounded-lg p-2 text-center shadow-sm`}
            >
              <div className="text-xs font-bold">{getResultLabel(result)}</div>
            </div>
          ))}
        </div>
        
        {/* Results Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Results Legend:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(getResultColor).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 ${color} rounded-full`}></div>
                <span className="text-gray-600">{getResultLabel(key)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Statistics */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Statistics:</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {displayResults.filter(r => r === 'P1').length}
              </div>
              <div className="text-gray-500">Player 1 Wins</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {displayResults.filter(r => r === 'P2').length}
              </div>
              <div className="text-gray-500">Player 2 Wins</div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-medium transition-colors">
              📊 Detailed Stats
            </button>
            <button className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm font-medium transition-colors">
              📋 Full History
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

export default LastResults
