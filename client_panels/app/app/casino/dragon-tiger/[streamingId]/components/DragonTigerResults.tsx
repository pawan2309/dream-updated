'use client'

import React, { useMemo } from 'react';
import { useDragonTiger } from '../context/DragonTigerContext';

interface DragonTigerResultsProps {
  isMobile: boolean;
  isTablet: boolean;
}

export default function DragonTigerResults({ isMobile, isTablet }: DragonTigerResultsProps) {
  const { state } = useDragonTiger();
  const { recentResults, winner } = state;

  // Calculate statistics
  const stats = useMemo(() => {
    const total = recentResults.length;
    if (total === 0) return { dragon: 0, tiger: 0, tie: 0, percentages: { dragon: 0, tiger: 0, tie: 0 } };

    const dragon = recentResults.filter(r => r === 'dragon').length;
    const tiger = recentResults.filter(r => r === 'tiger').length;
    const tie = recentResults.filter(r => r === 'tie').length;

    return {
      dragon,
      tiger,
      tie,
      percentages: {
        dragon: Math.round((dragon / total) * 100),
        tiger: Math.round((tiger / total) * 100),
        tie: Math.round((tie / total) * 100)
      }
    };
  }, [recentResults]);

  // Get result color and icon
  const getResultDisplay = (result: 'dragon' | 'tiger' | 'tie') => {
    switch (result) {
      case 'dragon':
        return { color: 'bg-blue-500', icon: '🐉', text: 'D' };
      case 'tiger':
        return { color: 'bg-orange-500', icon: '🐯', text: 'T' };
      case 'tie':
        return { color: 'bg-purple-500', icon: '🎯', text: 'X' };
      default:
        return { color: 'bg-gray-500', icon: '❓', text: '?' };
    }
  };

  // Get streak analysis
  const getStreakAnalysis = () => {
    if (recentResults.length === 0) return { currentStreak: 0, longestStreak: 0, side: null };

    let currentStreak = 1;
    let longestStreak = 1;
    let currentSide = recentResults[0];
    let maxSide = recentResults[0];

    for (let i = 1; i < recentResults.length; i++) {
      if (recentResults[i] === currentSide) {
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          maxSide = currentSide;
        }
      } else {
        currentStreak = 1;
        currentSide = recentResults[i];
      }
    }

    return { currentStreak, longestStreak, side: maxSide };
  };

  const streakAnalysis = getStreakAnalysis();

  // Get pattern insights
  const getPatternInsights = () => {
    if (recentResults.length < 3) return [];

    const insights = [];
    
    // Check for alternating pattern
    let alternating = true;
    for (let i = 1; i < recentResults.length; i++) {
      if (recentResults[i] === recentResults[i - 1]) {
        alternating = false;
        break;
      }
    }
    if (alternating) insights.push('Alternating pattern detected');

    // Check for tie frequency
    if (stats.percentages.tie > 20) insights.push('High tie frequency');
    if (stats.percentages.tie < 5) insights.push('Low tie frequency');

    // Check for side dominance
    if (stats.percentages.dragon > 60) insights.push('Dragon dominance');
    if (stats.percentages.tiger > 60) insights.push('Tiger dominance');

    return insights;
  };

  const patternInsights = getPatternInsights();

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Recent Results</h3>
        <p className="text-gray-600 text-sm">
          Last {recentResults.length} rounds • {winner ? 'Current round finished' : 'Round in progress'}
        </p>
      </div>

      {/* Results Grid */}
      <div className="mb-6">
        <div className="grid grid-cols-10 gap-2 mb-4">
          {recentResults.slice(0, 10).map((result, index) => {
            const display = getResultDisplay(result);
            return (
              <div
                key={index}
                className={`${display.color} text-white text-center py-2 px-1 rounded-lg font-bold text-sm shadow-md transition-transform hover:scale-110 cursor-pointer`}
                title={`Round ${index + 1}: ${result.charAt(0).toUpperCase() + result.slice(1)}`}
              >
                {display.text}
              </div>
            );
          })}
        </div>
        
        {recentResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No results yet</p>
            <p className="text-sm">Results will appear here after the first round</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Dragon Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">🐉</div>
          <div className="text-lg font-bold text-blue-800">{stats.dragon}</div>
          <div className="text-sm text-blue-600">{stats.percentages.dragon}%</div>
          <div className="text-xs text-blue-500">Dragon Wins</div>
        </div>

        {/* Tiger Stats */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">🐯</div>
          <div className="text-lg font-bold text-orange-800">{stats.tiger}</div>
          <div className="text-sm text-orange-600">{stats.percentages.tiger}%</div>
          <div className="text-xs text-orange-500">Tiger Wins</div>
        </div>

        {/* Tie Stats */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-lg font-bold text-purple-800">{stats.tie}</div>
          <div className="text-sm text-purple-600">{stats.percentages.tie}%</div>
          <div className="text-xs text-purple-500">Ties</div>
        </div>
      </div>

      {/* Streak Analysis */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Streak Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{streakAnalysis.currentStreak}</div>
            <div className="text-sm text-green-600">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{streakAnalysis.longestStreak}</div>
            <div className="text-sm text-blue-600">Longest Streak</div>
            {streakAnalysis.side && (
              <div className="text-xs text-gray-500 mt-1">
                {streakAnalysis.side === 'dragon' ? '🐉 Dragon' : 
                 streakAnalysis.side === 'tiger' ? '🐯 Tiger' : '🎯 Tie'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pattern Insights */}
      {patternInsights.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-3">💡 Pattern Insights</h4>
          <div className="space-y-2">
            {patternInsights.map((insight, index) => (
              <div key={index} className="flex items-center text-sm text-yellow-700">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Results Summary</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total Rounds:</span>
            <span className="font-medium">{recentResults.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Most Frequent:</span>
            <span className="font-medium">
              {stats.dragon > stats.tiger && stats.dragon > stats.tie ? '🐉 Dragon' :
               stats.tiger > stats.dragon && stats.tiger > stats.tie ? '🐯 Tiger' :
               stats.tie > stats.dragon && stats.tie > stats.tiger ? '🎯 Tie' : 'Even'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Rare Outcome:</span>
            <span className="font-medium">
              {stats.dragon < stats.tiger && stats.dragon < stats.tie ? '🐉 Dragon' :
               stats.tiger < stats.dragon && stats.tiger < stats.tie ? '🐯 Tiger' :
               stats.tie < stats.dragon && stats.tie < stats.tiger ? '🎯 Tie' : 'Even'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh Results
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Casino
        </button>
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>Results are updated in real-time. Past performance does not guarantee future outcomes.</p>
      </div>
    </div>
  );
}
