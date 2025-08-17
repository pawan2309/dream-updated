import React, { useState, useEffect } from 'react';

interface AndarBaharResultsProps {
  streamingId: string;
  recentResults: ('andar' | 'bahar')[];
  statistics: {
    totalGames: number;
    andarWins: number;
    baharWins: number;
    averageBet: number;
  };
}

export function AndarBaharResults({ 
  streamingId, 
  recentResults, 
  statistics 
}: AndarBaharResultsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentStreak = (results: ('andar' | 'bahar')[]) => {
    if (results.length === 0) return { side: null, count: 0 };
    
    let currentSide = results[0];
    let count = 1;
    
    for (let i = 1; i < results.length; i++) {
      if (results[i] === currentSide) {
        count++;
      } else {
        break;
      }
    }
    
    return { side: currentSide, count };
  };

  const getMostCommonResult = (results: ('andar' | 'bahar')[]) => {
    if (results.length === 0) return null;
    
    const counts = results.reduce((acc, result) => {
      acc[result] = (acc[result] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
  };

  const currentStreak = getCurrentStreak(recentResults);
  const mostCommon = getMostCommonResult(recentResults);

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Recent Results</h3>
      
      {/* Results Grid */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-3">Last 10 Games</h4>
        <div className="grid grid-cols-5 gap-2">
          {recentResults.slice(0, 10).map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-center font-bold text-white ${
                result === 'andar' 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}
            >
              {result === 'andar' ? '🟢' : '🔴'}
            </div>
          ))}
        </div>
        {recentResults.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No recent results available
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-3">Game Statistics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-800">{statistics.totalGames}</div>
            <div className="text-sm text-blue-600">Total Games</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-800">{statistics.averageBet}</div>
            <div className="text-sm text-green-600">Avg Bet</div>
          </div>
        </div>
      </div>

      {/* Win Distribution */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-3">Win Distribution</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-green-600 font-medium">🟢 Andar</span>
            <span className="font-bold">{statistics.andarWins}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-red-600 font-medium">🔴 Bahar</span>
            <span className="font-bold">{statistics.baharWins}</span>
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-3">Pattern Analysis</h4>
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Current Streak</div>
            <div className="font-bold">
              {currentStreak.side ? (
                <span className={currentStreak.side === 'andar' ? 'text-green-600' : 'text-red-600'}>
                  {currentStreak.side === 'andar' ? '🟢' : '🔴'} {currentStreak.side} ({currentStreak.count})
                </span>
              ) : (
                'None'
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Most Common</div>
            <div className="font-bold">
              {mostCommon ? (
                <span className={mostCommon === 'andar' ? 'text-green-600' : 'text-red-600'}>
                  {mostCommon === 'andar' ? '🟢' : '🔴'} {mostCommon}
                </span>
              ) : (
                'None'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex space-x-2">
          <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
            View History
          </button>
          <button className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default AndarBaharResults;
