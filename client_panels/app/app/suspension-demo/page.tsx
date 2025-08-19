'use client'

import React, { useState } from 'react';
import GlobalSuspensionOverlay, { MiniSuspensionIndicator } from '../../../components/GlobalSuspensionOverlay';
import { BettingMarket } from '../../../lib/oddsService';

// Sample markets data with various suspension states
const sampleMarkets: BettingMarket[] = [
  {
    id: 'match_odds',
    name: 'MATCH_ODDS',
    type: 'match_winner',
    minStake: 100,
    maxStake: 10000,
    status: 'active',
    selections: [
      { id: '1', name: 'Selection 1', odds: 1.5, stake: 1000, status: 'active', gstatus: 'ACTIVE' },
      { id: '2', name: 'Selection 2', odds: 2.0, stake: 500, status: 'active', gstatus: 'SUSPENDED' },
      { id: '3', name: 'Selection 3', odds: 1.8, stake: 800, status: 'suspended', gstatus: 'ACTIVE' },
      { id: '4', name: 'Selection 4', odds: 2.5, stake: 300, status: 'settled', gstatus: 'ACTIVE' }
    ]
  },
  {
    id: 'bookmaker',
    name: 'BOOKMAKER',
    type: 'custom',
    minStake: 50,
    maxStake: 5000,
    status: 'suspended',
    selections: [
      { id: '5', name: 'Selection 5', odds: 1.2, stake: 2000, status: 'active', gstatus: 'ACTIVE' },
      { id: '6', name: 'Selection 6', odds: 3.0, stake: 100, status: 'active', gstatus: 'SUSPENDED' }
    ]
  },
  {
    id: 'fancy',
    name: 'FANCY',
    type: 'over_runs',
    minStake: 200,
    maxStake: 15000,
    status: 'settled',
    selections: [
      { id: '7', name: 'Selection 7', odds: 1.1, stake: 5000, status: 'active', gstatus: 'ACTIVE' },
      { id: '8', name: 'Selection 8', odds: 4.0, stake: 200, status: 'active', gstatus: 'SUSPENDED' }
    ]
  }
];

export default function SuspensionDemoPage() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [markets, setMarkets] = useState(sampleMarkets);

  const toggleMarketStatus = (marketId: string) => {
    setMarkets(prev => prev.map(market => 
      market.id === marketId 
        ? { ...market, status: market.status === 'active' ? 'suspended' : 'active' }
        : market
    ));
  };

  const toggleSelectionStatus = (marketId: string, selectionId: string) => {
    setMarkets(prev => prev.map(market => 
      market.id === marketId 
        ? {
            ...market,
            selections: market.selections.map(selection =>
              selection.id === selectionId
                ? { 
                    ...selection, 
                    gstatus: selection.gstatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' 
                  }
                : selection
            )
          }
        : market
    ));
  };

  const hasSuspensions = markets.some(market => 
    market.status === 'suspended' || 
    market.status === 'settled' ||
    market.selections.some(selection => 
      selection.gstatus === 'SUSPENDED' || 
      selection.status === 'suspended' ||
      selection.status === 'settled'
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Suspension Overlay Demo
          </h1>
          <p className="text-gray-600 mb-6">
            This demo showcases how the suspension overlay works based on the <code>g</code> status 
            from the odds API. The overlay appears when markets or selections are suspended.
          </p>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3">Market Controls</h3>
              <div className="space-y-2">
                {markets.map(market => (
                  <div key={market.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{market.name}</span>
                    <button
                      onClick={() => toggleMarketStatus(market.id)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        market.status === 'active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {market.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-3">Selection Controls</h3>
              <div className="space-y-2">
                {markets.flatMap(market => 
                  market.selections.map(selection => (
                    <div key={selection.id} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {market.name} - {selection.id}
                      </span>
                      <button
                        onClick={() => toggleSelectionStatus(market.id, selection.id)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          selection.gstatus === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {selection.gstatus}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Current Status</h3>
              <MiniSuspensionIndicator markets={markets} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {markets.filter(m => m.status === 'active').length}
                </div>
                <div className="text-gray-600">Active Markets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {markets.filter(m => m.status === 'suspended').length}
                </div>
                <div className="text-gray-600">Suspended Markets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {markets.filter(m => m.status === 'settled').length}
                </div>
                <div className="text-gray-600">Settled Markets</div>
              </div>
            </div>
          </div>

          {/* Toggle Overlay Button */}
          <div className="text-center">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                showOverlay
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showOverlay ? 'Hide' : 'Show'} Suspension Overlay
            </button>
          </div>
        </div>

        {/* Markets Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Markets Overview</h2>
          <div className="space-y-4">
            {markets.map(market => (
              <div key={market.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{market.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    market.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : market.status === 'suspended'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {market.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {market.selections.map(selection => (
                    <div key={selection.id} className="text-center p-2 border border-gray-200 rounded">
                      <div className="text-xs text-gray-600 mb-1">Selection {selection.id}</div>
                      <div className={`text-xs font-medium ${
                        selection.gstatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selection.gstatus}
                      </div>
                      <div className={`text-xs ${
                        selection.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selection.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Suspension Overlay */}
      {showOverlay && hasSuspensions && (
        <GlobalSuspensionOverlay markets={markets} />
      )}
    </div>
  );
}
