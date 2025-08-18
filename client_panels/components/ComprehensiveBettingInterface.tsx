'use client'

import React, { useEffect, useState } from 'react';
import { OddsData, BettingMarket } from '../lib/oddsService';
import { websocketService } from '../lib/websocketService';
import { useMarketStatus } from '../lib/hooks/useMarketStatus';
import MarketSuspensionOverlay from './MarketSuspensionOverlay';
import SuspendedBettingButton from './SuspendedBettingButton';

interface ComprehensiveBettingInterfaceProps {
  oddsData: OddsData | null;
  loading: boolean;
  onAddBet: (market: BettingMarket, selection: any, type: 'back' | 'lay') => void;
  matchId?: string; // Add matchId for WebSocket subscription
}

export default function ComprehensiveBettingInterface({ 
  oddsData, 
  loading, 
  onAddBet,
  matchId 
}: ComprehensiveBettingInterfaceProps) {
  const [localOddsData, setLocalOddsData] = useState<OddsData | null>(oddsData);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [selectedMarket, setSelectedMarket] = useState<string>('match_odds');

  // Use market status hook for the selected market
  const { 
    marketStatus, 
    loading: statusLoading, 
    canAcceptBets, 
    isMarketSuspended, 
    isMarketClosed,
    getStatusColor,
    getStatusText
  } = useMarketStatus(matchId || '', selectedMarket);

  // Subscribe to real-time odds updates via WebSocket
  useEffect(() => {
    if (!matchId) return;

    // Subscribe to odds updates for this specific match
    const unsubscribeOdds = websocketService.subscribe('odds_update', (update: any) => {
      if (update.matchId === matchId) {
        console.log('🔄 [WEBSOCKET] Odds update received for match:', matchId, update);
        
        // Update local odds data with new information
        setLocalOddsData(prevData => {
          if (!prevData) return prevData;
          
          // Merge the updated odds data
          return {
            ...prevData,
            lastUpdated: new Date().toISOString(),
            markets: update.data?.markets || prevData.markets
          };
        });
        
        setLastUpdate(new Date());
      }
    });

    // Subscribe to match updates
    const unsubscribeMatch = websocketService.subscribe('match_update', (update: any) => {
      if (update.matchId === matchId) {
        console.log('🔄 [WEBSOCKET] Match update received for match:', matchId, update);
        setLastUpdate(new Date());
      }
    });

    // Subscribe to the specific match
    websocketService.subscribeToMatch(matchId);

    // Cleanup function
    return () => {
      unsubscribeOdds();
      unsubscribeMatch();
      websocketService.unsubscribeFromMatch(matchId);
    };
  }, [matchId]);

  // Update local odds data when props change
  useEffect(() => {
    setLocalOddsData(oddsData);
  }, [oddsData]);

  // Use local odds data for rendering (allows real-time updates)
  const currentOddsData = localOddsData || oddsData;

  // Helper function to group selections by name and type
  const groupSelectionsByMarket = (marketId: string) => {
    const market = currentOddsData?.markets?.find(m => m.id === marketId);
    if (!market) return {};

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
  const renderTierOdds = (selections: any[], type: 'back' | 'lay', market: BettingMarket, baseColor: string) => {
    if (selections.length === 0) {
      return (
        <div className="px-3 py-2 text-gray-400 text-sm">
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

      const isSelectionDisabled = !canAcceptBets() || selection.status === 'suspended';

      return (
        <SuspendedBettingButton
          key={selection.id}
          marketStatus={marketStatus}
          disabled={isSelectionDisabled}
          onClick={() => canAcceptBets() && onAddBet(market, selection, type)}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${tierStyles}`}
          showSuspensionIndicator={false}
        >
          <div className="font-bold">{selection.odds.toFixed(2)}</div>
          <div className="text-xs">
            {tierLabel}: {selection.stake.toLocaleString()}
          </div>
        </SuspendedBettingButton>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Market Status Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">Market Status</h2>
            {!statusLoading && marketStatus && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor().replace('text-', 'bg-')}`} />
                {getStatusText()}
              </div>
            )}
          </div>
          
          {lastUpdate && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {/* Market selection tabs */}
        <div className="mt-4 flex space-x-2">
          {['match_odds', 'bookmaker', 'fancy'].map((marketId) => (
            <button
              key={marketId}
              onClick={() => setSelectedMarket(marketId)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMarket === marketId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {marketId.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Market Status Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">Market Status</h2>
            {!statusLoading && marketStatus && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor().replace('text-', 'bg-')}`} />
                {getStatusText()}
              </div>
            )}
          </div>
          
          {lastUpdate && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {/* Market selection tabs */}
        <div className="mt-4 flex space-x-2">
          {['match_odds', 'bookmaker', 'fancy'].map((marketId) => (
            <button
              key={marketId}
              onClick={() => setSelectedMarket(marketId)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMarket === marketId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {marketId.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Update Indicator */}
      {lastUpdate && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-700">
              Real-time odds updated at {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* MATCH_ODDS Section */}
      <div className="game-market market-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
        {/* Suspension Overlay */}
        <MarketSuspensionOverlay
          marketStatus={marketStatus}
          isVisible={isMarketSuspended() || isMarketClosed()}
          className="rounded-lg"
        />
        
        <div className="market-title bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">MATCH_ODDS</span>
          <SuspendedBettingButton
            marketStatus={marketStatus}
            disabled={!canAcceptBets()}
            className="btn btn-success btn-sm px-3 py-1 bg-green-500 text-white rounded text-sm"
            showSuspensionIndicator={false}
          >
            Cashout
          </SuspendedBettingButton>
        </div>
        
        <div className="market-header bg-gray-100 px-4 py-2 border-b border-gray-200">
          <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-600">
            <div className="market-nation-detail col-span-2">
              <span className="market-nation-name">Max: 10K</span>
            </div>
            <div className="market-odd-box no-border d-none d-md-block"></div>
            <div className="market-odd-box no-border d-none d-md-block"></div>
            <div className="market-odd-box back text-center">
              <b className="text-blue-600">Back</b>
            </div>
            <div className="market-odd-box lay text-center">
              <b className="text-pink-600">Lay</b>
            </div>
            <div className="market-odd-box"></div>
            <div className="market-odd-box no-border"></div>
          </div>
        </div>

        <div className="market-body">
          {(() => {
            const groupedSelections = groupSelectionsByMarket('match_odds');
            const market = currentOddsData?.markets?.find(m => m.id === 'match_odds');
            
            if (!market || Object.keys(groupedSelections).length === 0) {
              return (
                <div className="p-6 text-center text-gray-500">
                  {loading ? 'Loading odds...' : 'No match odds available'}
                </div>
              );
            }

            return Object.entries(groupedSelections).map(([name, selections]) => (
              <div key={name} className="market-row border-b border-gray-200 last:border-b-0">
                <div className="grid grid-cols-7 gap-2 px-4 py-3 items-center">
                  <div className="market-nation-detail col-span-2">
                    <span className="market-nation-name text-sm font-medium text-gray-900">{name}</span>
                    <div className="market-nation-book"></div>
                  </div>
                  
                  {/* Back2 */}
                  <div className="market-odd-box back2 text-center">
                    {selections.back.length >= 3 ? (
                      <>
                        <span className="market-odd block font-bold text-blue-800">{selections.back[2].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.back[2].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Back1 */}
                  <div className="market-odd-box back1 text-center">
                    {selections.back.length >= 2 ? (
                      <>
                        <span className="market-odd block font-bold text-blue-700">{selections.back[1].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.back[1].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Back (Best) */}
                  <div className="market-odd-box back text-center">
                    {selections.back.length >= 1 ? (
                      <>
                        <span className="market-odd block font-bold text-blue-600">{selections.back[0].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.back[0].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Lay (Best) */}
                  <div className="market-odd-box lay text-center">
                    {selections.lay.length >= 1 ? (
                      <>
                        <span className="market-odd block font-bold text-pink-600">{selections.lay[0].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.lay[0].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Lay1 */}
                  <div className="market-odd-box lay1 text-center">
                    {selections.lay.length >= 2 ? (
                      <>
                        <span className="market-odd block font-bold text-pink-700">{selections.lay[1].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.lay[1].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Lay2 */}
                  <div className="market-odd-box lay2 text-center">
                    {selections.lay.length >= 3 ? (
                      <>
                        <span className="market-odd block font-bold text-pink-800">{selections.lay[2].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.lay[2].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Bookmaker Section */}
      <div className="game-market market-4 width70 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
        {/* Suspension Overlay */}
        <MarketSuspensionOverlay
          marketStatus={marketStatus}
          isVisible={isMarketSuspended() || isMarketClosed()}
          className="rounded-lg"
        />
        
        <div className="market-title bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Bookmaker</span>
          <SuspendedBettingButton
            marketStatus={marketStatus}
            disabled={!canAcceptBets()}
            className="btn btn-success btn-sm px-3 py-1 bg-green-500 text-white rounded text-sm"
            showSuspensionIndicator={false}
          >
            Cashout
          </SuspendedBettingButton>
        </div>
        
        <div className="market-header bg-gray-100 px-4 py-2 border-b border-gray-200">
          <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-600">
            <div className="market-nation-detail col-span-2">
              <span className="market-nation-name">Min: 100 Max: 5L</span>
            </div>
            <div className="market-odd-box no-border d-none d-md-block"></div>
            <div className="market-odd-box no-border d-none d-md-block"></div>
            <div className="market-odd-box back text-center">
              <b className="text-blue-600">Back</b>
            </div>
            <div className="market-odd-box lay text-center">
              <b className="text-pink-600">Lay</b>
            </div>
            <div className="market-odd-box"></div>
            <div className="market-odd-box no-border"></div>
          </div>
        </div>

        <div className="market-body">
          {(() => {
            const groupedSelections = groupSelectionsByMarket('bookmaker');
            const market = currentOddsData?.markets?.find(m => m.id === 'bookmaker');
            
            if (!market || Object.keys(groupedSelections).length === 0) {
              return (
                <div className="p-6 text-center text-gray-500">
                  {loading ? 'Loading odds...' : 'No bookmaker odds available'}
                </div>
              );
            }

            return Object.entries(groupedSelections).map(([name, selections]) => (
              <div key={name} className="market-row border-b border-gray-200 last:border-b-0">
                <div className="grid grid-cols-7 gap-2 px-4 py-3 items-center">
                  <div className="market-nation-detail col-span-2">
                    <span className="market-nation-name text-sm font-medium text-gray-900">{name}</span>
                    <div className="market-nation-book"></div>
                  </div>
                  
                  {/* Back2 */}
                  <div className="market-odd-box back2 text-center">
                    {selections.back.length >= 3 ? (
                      <>
                        <span className="market-odd block font-bold text-blue-800">{selections.back[2].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.back[2].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Back1 */}
                  <div className="market-odd-box back1 text-center">
                    {selections.back.length >= 2 ? (
                      <>
                        <span className="market-odd block font-bold text-blue-700">{selections.back[1].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.back[1].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Back (Best) */}
                  <div className="market-odd-box back text-center">
                    {selections.back.length >= 1 ? (
                      <>
                        <span className="market-odd block font-bold text-blue-600">{selections.back[0].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.back[0].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Lay (Best) */}
                  <div className="market-odd-box lay text-center">
                    {selections.lay.length >= 1 ? (
                      <>
                        <span className="market-odd block font-bold text-pink-600">{selections.lay[0].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.lay[0].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Lay1 */}
                  <div className="market-odd-box lay1 text-center">
                    {selections.lay.length >= 2 ? (
                      <>
                        <span className="market-odd block font-bold text-pink-700">{selections.lay[1].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.lay[1].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Lay2 */}
                  <div className="market-odd-box lay2 text-center">
                    {selections.lay.length >= 3 ? (
                      <>
                        <span className="market-odd block font-bold text-pink-800">{selections.lay[2].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.lay[2].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Fancy Section */}
      <div className="game-market market-4 width70 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
        {/* Suspension Overlay */}
        <MarketSuspensionOverlay
          marketStatus={marketStatus}
          isVisible={isMarketSuspended() || isMarketClosed()}
          className="rounded-lg"
        />
        
        <div className="market-title bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Fancy</span>
          <SuspendedBettingButton
            marketStatus={marketStatus}
            disabled={!canAcceptBets()}
            className="btn btn-success btn-sm px-3 py-1 bg-green-500 text-white rounded text-sm"
            showSuspensionIndicator={false}
          >
            Cashout
          </SuspendedBettingButton>
        </div>
        
        <div className="market-header bg-gray-100 px-4 py-2 border-b border-gray-200">
          <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-600">
            <div className="market-nation-detail col-span-2">
              <span className="market-nation-name">Min: 100 Max: 5L</span>
            </div>
            <div className="market-odd-box no-border d-none d-md-block"></div>
            <div className="market-odd-box no-border d-none d-md-block"></div>
            <div className="market-odd-box back text-center">
              <b className="text-blue-600">Back</b>
            </div>
            <div className="market-odd-box lay text-center">
              <b className="text-pink-600">Lay</b>
            </div>
            <div className="market-odd-box"></div>
            <div className="market-odd-box no-border"></div>
          </div>
        </div>

        <div className="market-body">
          {(() => {
            const groupedSelections = groupSelectionsByMarket('fancy');
            const market = currentOddsData?.markets?.find(m => m.id === 'fancy');
            
            if (!market || Object.keys(groupedSelections).length === 0) {
              return (
                <div className="p-6 text-center text-gray-500">
                  {loading ? 'Loading odds...' : 'No fancy odds available'}
                </div>
              );
            }

            return Object.entries(groupedSelections).map(([name, selections]) => (
              <div key={name} className="market-row border-b border-gray-200 last:border-b-0">
                <div className="grid grid-cols-7 gap-2 px-4 py-3 items-center">
                  <div className="market-nation-detail col-span-2">
                    <span className="market-nation-name text-sm font-medium text-gray-900">{name}</span>
                    <div className="market-nation-book"></div>
                  </div>
                  
                  {/* Back2 */}
                  <div className="market-odd-box back2 text-center">
                    {selections.back.length >= 3 ? (
                      <>
                        <span className="market-odd block font-bold text-blue-800">{selections.back[2].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.back[2].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Back1 */}
                  <div className="market-odd-box back1 text-center">
                    {selections.back.length >= 2 ? (
                      <>
                        <span className="market-odd block font-bold text-blue-700">{selections.back[1].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.back[1].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Back (Best) */}
                  <div className="market-odd-box back text-center">
                    {selections.back.length >= 1 ? (
                      <>
                        <span className="market-odd block font-bold text-blue-600">{selections.back[0].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.back[0].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Lay (Best) */}
                  <div className="market-odd-box lay text-center">
                    {selections.lay.length >= 1 ? (
                      <>
                        <span className="market-odd block font-bold text-pink-600">{selections.lay[0].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.lay[0].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Lay1 */}
                  <div className="market-odd-box lay1 text-center">
                    {selections.lay.length >= 2 ? (
                      <>
                        <span className="market-odd block font-bold text-pink-700">{selections.lay[1].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.lay[1].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                  
                  {/* Lay2 */}
                  <div className="market-odd-box lay2 text-center">
                    {selections.lay.length >= 3 ? (
                      <>
                        <span className="market-odd block font-bold text-pink-800">{selections.lay[2].odds.toFixed(2)}</span>
                        <span className="market-volume block text-xs text-gray-600">{selections.lay[2].stake.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="market-odd text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
