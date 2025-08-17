'use client'

import React, { useEffect, useState } from 'react';
import { OddsData, BettingMarket } from '../lib/oddsService';
import { websocketService } from '../lib/websocketService';

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

  // Subscribe to real-time odds updates via WebSocket
  useEffect(() => {
    if (!matchId) return;

    // Subscribe to odds updates for this specific match
    const unsubscribeOdds = websocketService.subscribe('odds_update', (update) => {
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
    const unsubscribeMatch = websocketService.subscribe('match_update', (update) => {
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

      return (
        <button 
          key={selection.id}
          onClick={() => onAddBet(market, selection, type)}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${tierStyles}`}
        >
          <div className="font-bold">{selection.odds.toFixed(2)}</div>
          <div className="text-xs">
            {tierLabel}: {selection.stake.toLocaleString()}
          </div>
        </button>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Real-time Update Indicator */}
      {lastUpdate && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700">
              Real-time odds updated at {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* MATCH_ODDS Section */}
      <div className="game-market market-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="market-title bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">MATCH_ODDS</span>
          <button className="btn btn-success btn-sm px-3 py-1 bg-green-500 text-white rounded text-sm" disabled>
            Cashout
          </button>
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
      <div className="game-market market-4 width70 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="market-title bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Bookmaker</span>
          <button className="btn btn-success btn-sm px-3 py-1 bg-green-500 text-white rounded text-sm" disabled>
            Cashout
          </button>
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
        
        <div className="market-row p-4 bg-gray-50">
          <p className="market-remark text-sm text-gray-600 text-center">
            EPL and LALIGA Football Matches Advance Bets Started In Our Exchange.
          </p>
        </div>
      </div>

      {/* Tied Match Section */}
      <div className="game-market market-2 width30 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="market-title bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Tied Match</span>
          <button className="btn btn-success btn-sm px-3 py-1 bg-green-500 text-white rounded text-sm" disabled>
            Cashout
          </button>
        </div>
        
        <div className="market-header bg-gray-100 px-4 py-2 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600">
            <div className="market-nation-detail">
              <span className="market-nation-name">Min: 100 Max: 1L</span>
            </div>
            <div className="market-odd-box back text-center">
              <b className="text-blue-600">Back</b>
            </div>
            <div className="market-odd-box lay text-center">
              <b className="text-pink-600">Lay</b>
            </div>
          </div>
        </div>

        <div className="market-body">
          {(() => {
            const groupedSelections = groupSelectionsByMarket('tied_match');
            const market = currentOddsData?.markets?.find(m => m.id === 'tied_match');
            
            if (!market || Object.keys(groupedSelections).length === 0) {
              return (
                <div className="p-6 text-center text-gray-500">
                  {loading ? 'Loading odds...' : 'No tied match odds available'}
                </div>
              );
            }

            return Object.entries(groupedSelections).map(([name, selections]) => (
              <div key={name} className="market-row border-b border-gray-200 last:border-b-0">
                <div className="grid grid-cols-3 gap-2 px-4 py-3 items-center">
                  <div className="market-nation-detail">
                    <span className="market-nation-name text-sm font-medium text-gray-900">{name}</span>
                    <div className="market-nation-book"></div>
                  </div>
                  
                  {/* Back */}
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
                  
                  {/* Lay */}
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
                </div>
              </div>
            ));
          })()}
        </div>
        
        <div className="market-row p-4 bg-gray-50">
          <p className="market-remark text-sm text-gray-600 text-center">
            The Hundred Mens And Womens And CPL Cup Winner Bets Started In Our Exchange
          </p>
        </div>
      </div>

      {/* Normal Section */}
      <div className="game-market market-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="market-title bg-gray-50 px-4 py-3 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-900">Normal</span>
        </div>
        
        <div className="row row10">
          <div className="col-md-6">
            <div className="market-header bg-gray-100 px-4 py-2 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600">
                <div className="market-nation-detail"></div>
                <div className="market-odd-box lay text-center">
                  <b className="text-pink-600">No</b>
                </div>
                <div className="market-odd-box back text-center">
                  <b className="text-blue-600">Yes</b>
                </div>
                <div className="fancy-min-max-box"></div>
              </div>
            </div>
          </div>
          <div className="col-md-6 d-none d-xl-block">
            <div className="market-header bg-gray-100 px-4 py-2 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600">
                <div className="market-nation-detail"></div>
                <div className="market-odd-box lay text-center">
                  <b className="text-pink-600">No</b>
                </div>
                <div className="market-odd-box back text-center">
                  <b className="text-blue-600">Yes</b>
                </div>
                <div className="fancy-min-max-box"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="market-body">
          <div className="row row10">
            {(() => {
              const groupedSelections = groupSelectionsByMarket('normal');
              const market = currentOddsData?.markets?.find(m => m.id === 'normal');
              
              if (!market || Object.keys(groupedSelections).length === 0) {
                return (
                  <div className="col-12 p-6 text-center text-gray-500">
                    {loading ? 'Loading odds...' : 'No normal markets available'}
                  </div>
                );
              }

              return Object.entries(groupedSelections).slice(0, 20).map(([name, selections], index) => (
                <div key={name} className="col-md-6">
                  <div className="fancy-market border-b border-gray-200 last:border-b-0">
                    <div className="market-row">
                      <div className="grid grid-cols-4 gap-2 px-4 py-3 items-center">
                        <div className="market-nation-detail col-span-2">
                          <span className="market-nation-name text-sm font-medium text-gray-900 max-w-xs truncate block">
                            {name}
                          </span>
                        </div>
                        
                        {/* Lay (No) */}
                        <div className="market-odd-box lay text-center">
                          {selections.lay.length >= 1 ? (
                            <>
                              <span className="market-odd block font-bold text-pink-600">{selections.lay[0].odds.toFixed(0)}</span>
                              <span className="market-volume block text-xs text-gray-600">{selections.lay[0].stake.toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="market-odd text-gray-400">-</span>
                          )}
                        </div>
                        
                        {/* Back (Yes) */}
                        <div className="market-odd-box back text-center">
                          {selections.back.length >= 1 ? (
                            <>
                              <span className="market-odd block font-bold text-blue-600">{selections.back[0].odds.toFixed(0)}</span>
                              <span className="market-volume block text-xs text-gray-600">{selections.back[0].stake.toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="market-odd text-gray-400">-</span>
                          )}
                        </div>
                        
                        <div className="fancy-min-max-box">
                          <div className="fancy-min-max text-xs text-gray-500">
                            <span className="w-100 d-block">Min: 100</span>
                            <span className="w-100 d-block">Max: 4L</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Fancy Markets Section */}
      {currentOddsData?.markets?.find(m => m.id === 'fancy1') && (() => {
        const groupedSelections = groupSelectionsByMarket('fancy1');
        const market = currentOddsData.markets.find(m => m.id === 'fancy1');
        
        if (!market || Object.keys(groupedSelections).length === 0) return null;

        return (
          <div className="game-market market-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="market-title bg-gray-50 px-4 py-3 border-b border-gray-200">
              <span className="text-lg font-semibold text-gray-900">fancy1</span>
            </div>
            
            <div className="row row10">
              <div className="col-md-6">
                <div className="market-header bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600">
                    <div className="market-nation-detail"></div>
                    <div className="market-odd-box back text-center">
                      <b className="text-blue-600">Back</b>
                    </div>
                    <div className="market-odd-box lay text-center">
                      <b className="text-pink-600">Lay</b>
                    </div>
                    <div className="fancy-min-max-box"></div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 d-none d-xl-block">
                <div className="market-header bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600">
                    <div className="market-nation-detail"></div>
                    <div className="market-odd-box back text-center">
                      <b className="text-blue-600">Back</b>
                    </div>
                    <div className="market-odd-box lay text-center">
                      <b className="text-pink-600">Lay</b>
                    </div>
                    <div className="fancy-min-max-box"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="market-body">
              <div className="row row10">
                {Object.entries(groupedSelections).slice(0, 15).map(([name, selections]) => (
                  <div key={name} className="col-md-6">
                    <div className="fancy-market border-b border-gray-200 last:border-b-0">
                      <div className="market-row">
                        <div className="grid grid-cols-4 gap-2 px-4 py-3 items-center">
                          <div className="market-nation-detail col-span-2">
                            <span className="market-nation-name text-sm font-medium text-gray-900 max-w-xs truncate block">
                              {name}
                            </span>
                            <div className="market-nation-book"></div>
                          </div>
                          
                          {/* Back */}
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
                          
                          {/* Lay */}
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
                          
                          <div className="fancy-min-max-box">
                            <div className="fancy-min-max text-xs text-gray-500">
                              <span className="w-100 d-block">Min: 100</span>
                              <span className="w-100 d-block">Max: 1L</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sample Data Display when no odds available */}
      {!currentOddsData && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sample Markets (Demo)</h3>
                <p className="text-sm text-gray-600">This is sample data for demonstration</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center text-gray-500">
              <p>No odds data available. Please check the API connection or try refreshing the page.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
