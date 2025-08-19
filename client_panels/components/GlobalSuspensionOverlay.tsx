'use client'

import React from 'react';
import { BettingMarket } from '../lib/oddsService';

interface GlobalSuspensionOverlayProps {
  markets: BettingMarket[];
  className?: string;
}

export default function GlobalSuspensionOverlay({ 
  markets, 
  className = '' 
}: GlobalSuspensionOverlayProps) {
  // Check if any market or selection is suspended
  const hasSuspensions = markets.some(market => {
    // Check market level suspension
    if (market.status === 'suspended' || market.status === 'settled') {
      return true;
    }
    
    // Check selection level suspension (g status)
    return market.selections.some(selection => 
      selection.gstatus === 'SUSPENDED' || 
      selection.status === 'suspended' ||
      selection.status === 'settled'
    );
  });

  if (!hasSuspensions) return null;

  // Get suspension details for display
  const getSuspensionInfo = () => {
    const suspendedMarkets = markets.filter(market => 
      market.status === 'suspended' || market.status === 'settled'
    );

    const suspendedSelections = markets.flatMap(market =>
      market.selections
        .filter(selection => 
          selection.gstatus === 'SUSPENDED' || 
          selection.status === 'suspended' ||
          selection.status === 'settled'
        )
        .map(selection => ({
          marketName: market.name,
          selectionId: selection.id,
          marketId: market.id
        }))
    );

    return {
      suspendedMarkets,
      suspendedSelections,
      totalSuspended: suspendedMarkets.length + suspendedSelections.length
    };
  };

  const suspensionInfo = getSuspensionInfo();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />
      
      {/* Suspension overlay */}
      <div className="relative bg-white rounded-lg shadow-2xl border-2 border-red-500 max-w-2xl mx-4 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Betting Suspended
          </h2>
          <p className="text-gray-600">
            Some markets or selections are currently suspended
          </p>
        </div>

        {/* Suspension Details */}
        <div className="space-y-4">
          {/* Market Level Suspensions */}
          {suspensionInfo.suspendedMarkets.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">
                Suspended Markets ({suspensionInfo.suspendedMarkets.length})
              </h3>
              <div className="space-y-1">
                {suspensionInfo.suspendedMarkets.map(market => (
                  <div key={market.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{market.name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      market.status === 'suspended' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {market.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selection Level Suspensions */}
          {suspensionInfo.suspendedSelections.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Suspended Selections ({suspensionInfo.suspendedSelections.length})
              </h3>
              <div className="space-y-1">
                {suspensionInfo.suspendedSelections.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.marketName}</span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      SUSPENDED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-500 mb-3">
            Total suspended items: {suspensionInfo.totalSuspended}
          </div>
          <div className="text-xs text-gray-400">
            Suspended odds will show red overlays and cannot be clicked
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini version for compact display
export function MiniSuspensionIndicator({ markets }: { markets: GlobalSuspensionOverlayProps['markets'] }) {
  const hasSuspensions = markets.some(market => 
    market.status === 'suspended' || 
    market.status === 'settled' ||
    market.selections.some(selection => 
      selection.gstatus === 'SUSPENDED' || 
      selection.status === 'suspended' ||
      selection.status === 'settled'
    )
  );

  if (!hasSuspensions) return null;

  return (
    <div className="inline-flex items-center px-3 py-1 bg-red-100 border border-red-300 rounded-full">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
      <span className="text-xs font-medium text-red-700">SUSPENDED</span>
    </div>
  );
}
