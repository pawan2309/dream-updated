'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../../../components/Header';

export default function BettingPage() {
  const params = useParams();
  const [selectedMarket, setSelectedMarket] = useState<string>('match_winner');
  const [bets, setBets] = useState<any[]>([]);

  const cleanMatchId = (params.id as string)?.split('(')[0] || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex pt-0">
        {/* Left Sidebar - Matches List */}
        <div className="w-80 bg-white shadow-xl">
          <div className="h-full overflow-y-auto">
            {/* Sidebar Header */}
            <div className="bg-blue-600 p-4 text-white">
              <h2 className="text-lg font-bold">Matches</h2>
              <p className="text-sm opacity-90">Select a match to bet on</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { key: 'all', label: 'All', count: 5 },
                { key: 'live', label: 'Live', count: 2 },
                { key: 'upcoming', label: 'Upcoming', count: 3 }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => {}}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  {filter.label}
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Matches List */}
            <div className="p-4 space-y-2">
              <div className="p-3 rounded-lg border border-blue-500 bg-blue-50 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    Test Match
                  </span>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    LIVE
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Test Tournament • 2025-01-15
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Match Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Test Match</h1>
                  <p className="text-sm text-gray-600">Test Tournament • 2025-01-15 10:00</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium mb-1">LIVE</div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium">ID: {cleanMatchId}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scoreboard */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between text-white">
                {/* Left Team */}
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-300">T1</div>
                    <div className="text-sm opacity-90 text-gray-200">Team 1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">120-5</div>
                    <div className="text-sm opacity-75 text-gray-300">RR: 6.50</div>
                  </div>
                </div>

                {/* Center - Current Over */}
                <div className="text-center flex-1 mx-8">
                  <div className="text-4xl font-bold text-white mb-2">120-5</div>
                  <div className="text-lg opacity-90 text-gray-200 mb-3">
                    Team 1 Batting • RR: 6.50
                  </div>
                  
                  {/* Current Over Balls */}
                  <div className="flex justify-center gap-2 mb-2">
                    {['1', '4', 'W', '2', '6', '-'].map((ball, index) => (
                      <div 
                        key={index} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          ball === 'W' ? 'bg-red-500' : 
                          ball === '4' ? 'bg-green-500' : 
                          ball === '6' ? 'bg-purple-500' : 
                          ball === '1' ? 'bg-blue-500' :
                          ball === '2' ? 'bg-blue-600' :
                          ball === '-' ? 'bg-gray-500' : 'bg-gray-600'
                        }`}
                      >
                        {ball}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs opacity-75 text-gray-300">
                    Current Over • Team 1 batting
                  </div>
                </div>

                {/* Right Team */}
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">0-0</div>
                    <div className="text-sm opacity-75 text-gray-300">RR: 0.00</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-400">T2</div>
                    <div className="text-sm opacity-90 text-gray-200">Team 2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Betting Markets */}
          <div className="max-w-6xl mx-auto p-4">
            {/* Market Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'match_winner', label: 'Match Winner', icon: '🏆' },
                  { id: 'tied_match', label: 'Tied Match', icon: '⚖️' },
                  { id: 'over_runs', label: 'Sessions', icon: '📊' },
                  { id: 'player_specials', label: 'Player Specials', icon: '👤' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedMarket(tab.id)}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      selectedMarket === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Markets Grid */}
            <div className="grid gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Match Winner</h3>
                      <p className="text-sm text-gray-600">
                        Min: 100 • Max: 500,000
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Team 1</h4>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-800 hover:bg-blue-200">
                          <div className="text-lg font-bold">1.46</div>
                          <div className="text-xs">Back</div>
                        </button>

                        <button className="px-4 py-2 rounded-lg font-medium bg-pink-100 text-pink-800 hover:bg-pink-200">
                          <div className="text-lg font-bold">1.46</div>
                          <div className="text-xs">Lay</div>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Team 2</h4>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-800 hover:bg-blue-200">
                          <div className="text-lg font-bold">2.17</div>
                          <div className="text-xs">Back</div>
                        </button>

                        <button className="px-4 py-2 rounded-lg font-medium bg-pink-100 text-pink-800 hover:bg-pink-200">
                          <div className="text-lg font-bold">2.17</div>
                          <div className="text-xs">Lay</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm">
                      Cash Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Bet Slip & Live Feed */}
        <div className="w-96 bg-white shadow-xl">
          <div className="h-full overflow-y-auto">
            {/* Sidebar Header */}
            <div className="bg-blue-600 p-4 text-white">
              <h2 className="text-lg font-bold">Bet Slip</h2>
            </div>

            {/* Bet Slip */}
            <div className="p-4">
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No bets added yet</p>
                <p className="text-sm">Click on odds to add bets</p>
              </div>
            </div>

            {/* Live Feed Section */}
            <div className="border-t border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Feed</h3>
              
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center mb-4">
                <div className="text-gray-600 text-sm">Live Stream Placeholder</div>
              </div>

              {/* Stream Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-500">Offline</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Event ID:</span>
                  <span className="text-gray-800 font-medium">{cleanMatchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="text-blue-600 font-medium">Live TV</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
