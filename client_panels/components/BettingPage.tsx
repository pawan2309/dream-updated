'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Bet {
  marketId: string;
  selectionId: string;
  selectionName: string;
  odds: number;
  stake: number;
  type: 'back' | 'lay';
  marketName: string;
}

interface MarketCardProps {
  market: {
    id: string;
    name: string;
    minStake: number;
    maxStake: number;
    status: string;
    description?: string;
    selections: Array<{
      id: string;
      name: string;
      odds: number;
      status: string;
      type: 'back' | 'lay'; // Added type
      tier?: number; // Added tier
      stake?: number; // Added stake
    }>;
  };
  onAddBet: (market: any, selection: any, type: 'back' | 'lay') => void;
  bets: Bet[];
}

const MarketCard: React.FC<MarketCardProps> = ({ market, onAddBet, bets }) => {
  // Helper function to group selections by name and type
  const groupSelections = () => {
    const grouped: Record<string, { back: any[]; lay: any[] }> = {};
    
    market.selections.forEach(selection => {
      const baseName = selection.name;
      if (!grouped[baseName]) {
        grouped[baseName] = { back: [], lay: [] };
      }
      
      if (selection.type === 'back') {
        grouped[baseName].back.push(selection);
      } else if (selection.type === 'lay') {
        grouped[baseName].lay.push(selection);
      }
    });

    // Sort back odds (lowest to highest - best first) and lay odds (highest to lowest - best first)
    Object.values(grouped).forEach(group => {
      group.back.sort((a, b) => a.odds - b.odds);
      group.lay.sort((a, b) => b.odds - a.odds);
    });

    return grouped;
  };

  // Helper function to render tier-based odds buttons
  const renderTierOdds = (selections: any[], type: 'back' | 'lay') => {
    if (selections.length === 0) {
      return (
        <div className="px-4 py-2 text-gray-400 text-sm">
          No {type} odds
        </div>
      );
    }

    return selections.map((selection, index) => {
      const tier = selection.tier || index + 1;
      const tierLabel = type === 'back' ? `Back${tier}` : `Lay${tier}`;
      
      // Different styling for each tier
      const tierStyles = type === 'back' 
        ? index === 0 
          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
          : index === 1 
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'bg-blue-25 text-blue-600 hover:bg-blue-50'
        : index === 0 
          ? 'bg-pink-100 text-pink-800 hover:bg-pink-200' 
          : index === 1 
            ? 'bg-pink-50 text-pink-700 hover:bg-pink-100'
            : 'bg-pink-25 text-pink-600 hover:bg-pink-50';

      const isSelected = bets.some(bet => 
        bet.marketId === market.id && 
        bet.selectionId === selection.id && 
        bet.type === type
      );

      return (
        <button
          key={selection.id}
          onClick={() => onAddBet(market, selection, type)}
          disabled={selection.status === 'suspended'}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isSelected
              ? type === 'back' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-pink-600 text-white shadow-lg'
              : tierStyles
          } ${selection.status === 'suspended' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-lg font-bold">{selection.odds.toFixed(2)}</div>
          <div className="text-xs">{tierLabel}</div>
          {selection.stake && (
            <div className="text-xs opacity-75">
              Stake: {selection.stake.toLocaleString()}
            </div>
          )}
        </button>
      );
    });
  };

  const groupedSelections = groupSelections();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{market.name}</h3>
            <p className="text-sm text-gray-600">
              Min: {market.minStake.toLocaleString()} • Max: {market.maxStake.toLocaleString()}
            </p>
          </div>
          {market.description && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
              {market.description}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {Object.entries(groupedSelections).map(([name, selections]) => (
            <div key={name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{name}</h4>
                {selections.back.some(s => s.status === 'suspended') || selections.lay.some(s => s.status === 'suspended') && (
                  <span className="text-red-600 text-sm font-medium">SUSPENDED</span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <div className="flex flex-col space-y-1">
                  {renderTierOdds(selections.back, 'back')}
                </div>

                <div className="flex flex-col space-y-1">
                  {renderTierOdds(selections.lay, 'lay')}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm">
            Cash Out
          </button>
        </div>
      </div>
    </div>
  );
};

interface BetSlipProps {
  bets: Bet[];
  onUpdateStake: (betIndex: number, stake: number) => void;
  onRemoveBet: (betIndex: number) => void;
}

const BetSlip: React.FC<BetSlipProps> = ({ bets, onUpdateStake, onRemoveBet }) => {
  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const potentialWinnings = bets.reduce((sum, bet) => {
    if (bet.type === 'back') {
      return sum + (bet.stake * bet.odds - bet.stake);
    } else {
      return sum + (bet.stake * (bet.odds - 1));
    }
  }, 0);

  return (
    <div className="p-4">
      {bets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p>No bets added yet</p>
          <p className="text-sm">Click on odds to add bets</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.map((bet, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{bet.marketName}</span>
                <button
                  onClick={() => onRemoveBet(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{bet.selectionName}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    bet.type === 'back' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {bet.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900">{bet.odds.toFixed(2)}</div>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stake</label>
                <input
                  type="number"
                  value={bet.stake || ''}
                  onChange={(e) => onUpdateStake(index, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter stake"
                  min="0"
                  step="100"
                />
              </div>

              <div className="flex space-x-2 mb-3">
                {[100, 500, 1000].map((quickStake) => (
                  <button
                    key={quickStake}
                    onClick={() => onUpdateStake(index, quickStake)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    {quickStake}
                  </button>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                                  Potential: {bet.stake > 0 ? (bet.type === 'back' ? 
                    (bet.stake * bet.odds - bet.stake).toFixed(2) : 
                    (bet.stake * (bet.odds - 1)).toFixed(2)
                  ) : '0.00'}
              </div>
            </div>
          ))}

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">Total Stake:</span>
                                <span className="font-bold text-gray-900">{totalStake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-900">Potential Winnings:</span>
                                <span className="font-bold text-green-600">{potentialWinnings.toFixed(2)}</span>
            </div>
            
            <button
              disabled={totalStake === 0}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                totalStake > 0
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Place Bet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { MarketCard, BetSlip };
export type { Bet };
