'use client'

import React from 'react';

interface OddsSelection {
  id: string;
  name: string;
  odds: number;
  stake: number;
  type: 'back' | 'lay';
  status?: 'active' | 'suspended';
  gstatus?: 'ACTIVE' | 'SUSPENDED'; // API field for selection status
}

interface OddsMarket {
  id: string;
  name: string;
  status: 'OPEN' | 'SUSPENDED' | 'CLOSED';
  minStake: number;
  maxStake: number;
  selections: OddsSelection[];
}

interface OddsGridProps {
  markets: OddsMarket[];
  className?: string;
  onOddsClick?: (selection: OddsSelection, market: OddsMarket) => void;
}

export default function OddsGrid({ markets, className = '', onOddsClick }: OddsGridProps) {
  if (!markets || markets.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>No odds data available</p>
        </div>
      </div>
    );
  }

  const handleOddsClick = (selection: OddsSelection, market: OddsMarket) => {
    // Only allow clicks if selection is active and market is open
    if (selection.gstatus === 'SUSPENDED' || selection.status === 'suspended' || market.status !== 'OPEN') {
      return;
    }
    
    if (onOddsClick) {
      onOddsClick(selection, market);
    }
  };

  const isSelectionSuspended = (selection: OddsSelection, market: OddsMarket) => {
    return selection.gstatus === 'SUSPENDED' || 
           selection.status === 'suspended' || 
           market.status !== 'OPEN';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {markets.map((market) => (
        <div key={market.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Market Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{market.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Min: ₹{market.minStake?.toLocaleString() || '100'} | 
                  Max: ₹{market.maxStake?.toLocaleString() || '500K'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  market.status === 'OPEN' 
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : market.status === 'SUSPENDED'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {market.status}
                </span>
              </div>
            </div>
          </div>

          {/* Market Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200 w-1/3">
                    Selection
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200 w-1/3">
                    <div className="flex flex-col space-y-1">
                      <span className="text-blue-600 font-semibold">LAGAI (Back)</span>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>3rd</span>
                        <span>2nd</span>
                        <span>1st</span>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200 w-1/3">
                    <div className="flex flex-col space-y-1">
                      <span className="text-pink-600 font-semibold">KHAI (Lay)</span>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1st</span>
                        <span>2nd</span>
                        <span>3rd</span>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {market.selections
                  .filter(selection => selection.type === 'back')
                  .map((backSelection, index) => {
                    const laySelection = market.selections.find(
                      s => s.name === backSelection.name && s.type === 'lay'
                    );
                    
                    // Get the 3 best back odds for this selection
                    const backOdds = market.selections
                      .filter(s => s.name === backSelection.name && s.type === 'back')
                      .sort((a, b) => a.odds - b.odds)
                      .slice(0, 3);
                    
                    // Get the 3 best lay odds for this selection
                    const layOdds = market.selections
                      .filter(s => s.name === backSelection.name && s.type === 'lay')
                      .sort((a, b) => b.odds - a.odds)
                      .slice(0, 3);

                    return (
                      <tr key={`${backSelection.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={backSelection.name}>
                              {backSelection.name}
                            </div>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              isSelectionSuspended(backSelection, market)
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}>
                              {isSelectionSuspended(backSelection, market) ? 'SUSPENDED' : 'ACTIVE'}
                            </span>
                          </div>
                        </td>
                        
                        {/* Back Odds Column - LAGAI (3x1 format) */}
                        <td className="px-2 py-3 border-b border-gray-200">
                          <div className="flex space-x-2 justify-center">
                            {/* 3rd Best Back */}
                            {backOdds[2] ? (
                              <div 
                                className={`w-20 h-12 border rounded flex flex-col items-center justify-center transition-colors relative ${
                                  isSelectionSuspended(backOdds[2], market)
                                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 cursor-pointer hover:from-blue-200 hover:to-blue-300'
                                }`}
                                onClick={() => handleOddsClick(backOdds[2], market)}
                              >
                                {isSelectionSuspended(backOdds[2], market) ? (
                                  <>
                                    <div className="absolute inset-0 bg-red-500 bg-opacity-90 rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">SUSPENDED</span>
                                    </div>
                                    <div className="text-gray-400 text-sm">{backOdds[2].odds}</div>
                                    <div className="text-gray-400 text-xs">₹{backOdds[2].stake.toFixed(2)}</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-blue-800 font-bold text-sm">{backOdds[2].odds}</div>
                                    <div className="text-blue-600 text-xs">₹{backOdds[2].stake.toFixed(2)}</div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-sm">-</span>
                              </div>
                            )}
                            
                            {/* 2nd Best Back */}
                            {backOdds[1] ? (
                              <div 
                                className={`w-20 h-12 border rounded flex flex-col items-center justify-center transition-colors relative ${
                                  isSelectionSuspended(backOdds[1], market)
                                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-blue-200 to-blue-300 border-blue-400 cursor-pointer hover:from-blue-300 hover:to-blue-400'
                                }`}
                                onClick={() => handleOddsClick(backOdds[1], market)}
                              >
                                {isSelectionSuspended(backOdds[1], market) ? (
                                  <>
                                    <div className="absolute inset-0 bg-red-500 bg-opacity-90 rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">SUSPENDED</span>
                                    </div>
                                    <div className="text-gray-400 text-sm">{backOdds[1].odds}</div>
                                    <div className="text-gray-400 text-xs">₹{backOdds[1].stake.toFixed(2)}</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-blue-800 font-bold text-sm">{backOdds[1].odds}</div>
                                    <div className="text-blue-600 text-xs">₹{backOdds[1].stake.toFixed(2)}</div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-sm">-</span>
                              </div>
                            )}
                            
                            {/* Best Back */}
                            {backOdds[0] ? (
                              <div 
                                className={`w-20 h-12 border rounded flex flex-col items-center justify-center transition-colors relative ${
                                  isSelectionSuspended(backOdds[0], market)
                                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-blue-300 to-blue-400 border-blue-500 cursor-pointer hover:from-blue-400 hover:to-blue-500'
                                }`}
                                onClick={() => handleOddsClick(backOdds[0], market)}
                              >
                                {isSelectionSuspended(backOdds[0], market) ? (
                                  <>
                                    <div className="absolute inset-0 bg-red-500 bg-opacity-90 rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">SUSPENDED</span>
                                    </div>
                                    <div className="text-gray-400 text-sm">{backOdds[0].odds}</div>
                                    <div className="text-blue-600 text-xs">₹{backOdds[0].stake.toFixed(2)}</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-blue-800 font-bold text-sm">{backOdds[0].odds}</div>
                                    <div className="text-blue-600 text-xs">₹{backOdds[0].stake.toFixed(2)}</div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-sm">-</span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Lay Odds Column - KHAI (3x1 format) */}
                        <td className="px-2 py-3 border-b border-gray-200">
                          <div className="flex space-x-2 justify-center">
                            {/* Best Lay */}
                            {layOdds[0] ? (
                              <div 
                                className={`w-20 h-12 border rounded flex flex-col items-center justify-center transition-colors relative ${
                                  isSelectionSuspended(layOdds[0], market)
                                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-pink-300 to-pink-400 border-pink-500 cursor-pointer hover:from-pink-400 hover:to-pink-500'
                                }`}
                                onClick={() => handleOddsClick(layOdds[0], market)}
                              >
                                {isSelectionSuspended(layOdds[0], market) ? (
                                  <>
                                    <div className="absolute inset-0 bg-red-500 bg-opacity-90 rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">SUSPENDED</span>
                                    </div>
                                    <div className="text-gray-400 text-sm">{layOdds[0].odds}</div>
                                    <div className="text-gray-400 text-xs">₹{layOdds[0].stake.toFixed(2)}</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-pink-800 font-bold text-sm">{layOdds[0].odds}</div>
                                    <div className="text-pink-600 text-xs">₹{layOdds[0].stake.toFixed(2)}</div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-sm">-</span>
                              </div>
                            )}
                            
                            {/* 2nd Best Lay */}
                            {layOdds[1] ? (
                              <div 
                                className={`w-20 h-12 border rounded flex flex-col items-center justify-center transition-colors relative ${
                                  isSelectionSuspended(layOdds[1], market)
                                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-pink-200 to-pink-300 border-pink-400 cursor-pointer hover:from-pink-300 hover:to-pink-400'
                                }`}
                                onClick={() => handleOddsClick(layOdds[1], market)}
                              >
                                {isSelectionSuspended(layOdds[1], market) ? (
                                  <>
                                    <div className="absolute inset-0 bg-red-500 bg-opacity-90 rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">SUSPENDED</span>
                                    </div>
                                    <div className="text-gray-400 text-sm">{layOdds[1].odds}</div>
                                    <div className="text-gray-400 text-xs">₹{layOdds[1].stake.toFixed(2)}</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-pink-800 font-bold text-sm">{layOdds[1].odds}</div>
                                    <div className="text-pink-600 text-xs">₹{layOdds[1].stake.toFixed(2)}</div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-sm">-</span>
                              </div>
                            )}
                            
                            {/* 3rd Best Lay */}
                            {layOdds[2] ? (
                              <div 
                                className={`w-20 h-12 border rounded flex flex-col items-center justify-center transition-colors relative ${
                                  isSelectionSuspended(layOdds[2], market)
                                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-pink-100 to-pink-200 border-pink-300 cursor-pointer hover:from-pink-200 hover:to-pink-300'
                                }`}
                                onClick={() => handleOddsClick(layOdds[2], market)}
                              >
                                {isSelectionSuspended(layOdds[2], market) ? (
                                  <>
                                    <div className="absolute inset-0 bg-red-500 bg-opacity-90 rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">SUSPENDED</span>
                                    </div>
                                    <div className="text-gray-400 text-sm">{layOdds[2].odds}</div>
                                    <div className="text-gray-400 text-xs">₹{layOdds[2].stake.toFixed(2)}</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-pink-800 font-bold text-sm">{layOdds[2].odds}</div>
                                    <div className="text-pink-600 text-xs">₹{layOdds[2].stake.toFixed(2)}</div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-sm">-</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
