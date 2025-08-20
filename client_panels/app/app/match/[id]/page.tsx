'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InPlayMatch } from '../../../../lib/hooks/useInPlayMatches';
import Header from '../../../../components/Header';
import { scorecardService, ScorecardData } from '../../../../lib/scorecardService';
import { liveTVService } from '../../../../lib/liveTVService';
import oddsService, { OddsData, BettingMarket } from '../../../../lib/oddsService';
import HLSVideoPlayer from '../../../../components/HLSVideoPlayer';
import { websocketService } from '../../../../lib/websocketService';
import SuspendedOverlay from '../../../../components/SuspendedOverlay';
import BetSlip from '../../../../components/BetSlip';
import { Toast } from '../../../../components/Toast';

import { useAuth } from '../../../../lib/hooks/useAuth';
import { useOptimizedMatchUpdates } from '../../../../lib/hooks/useOptimizedMatchUpdates';

interface MatchDetailsPageProps {}

interface Bet {
  marketId: string;
  selectionId: string;
  selectionName: string;
  odds: number;
  stake: number;
  type: 'back' | 'lay';
  marketName: string;
  matchId: string;
}

interface BetSlipData {
  marketId: string;
  selectionId: string;
  selectionName: string;
  odds: number;
  type: 'back' | 'lay';
  marketName: string;
  matchId: string;
  stake?: number;
}

export default function MatchDetailsPage({}: MatchDetailsPageProps) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const matchId = params.id as string;
  
  // Simple gstatus helper functions for overlay functionality
  const isSelectionBlocked = (selection: any) => {
    // Always return false - no selections are blocked
    return false;
  };

  const getSuspensionText = (selection: any) => {
    // Always return empty string - no suspension text
    return '';
  };

  const getSuspensionBackgroundColor = (selection: any) => {
    // Always return empty string - no suspension background
    return '';
  };

  const [match, setMatch] = useState<InPlayMatch | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [oddsData, setOddsData] = useState<OddsData | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('match_winner');
  const [bets, setBets] = useState<Bet[]>([]);
  const [stake, setStake] = useState<number>(0);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  
  // Bet placement state
  const [selectedBet, setSelectedBet] = useState<BetSlipData | null>(null);
  const [betSlipOpen, setBetSlipOpen] = useState(false);

  // Function to handle bet confirmation (called after bet is already placed in BetSlip)
  const handleBetConfirm = async (stake: number): Promise<boolean> => {
    if (!selectedBet || !user) {
      console.error('❌ [BET] No bet selected or user not authenticated');
      return false;
    }

    try {
      console.log('🔍 [BET] Bet already placed in BetSlip, updating UI...');
      
      // Add bet to local state (bet was already placed in BetSlip)
      const newBet: Bet = {
        ...selectedBet,
        stake: stake
      };
      setBets(prev => [...prev, newBet]);
      
      // Reset bet slip
      setSelectedBet(null);
      setBetSlipOpen(false);
      
      return true;
    } catch (error) {
      console.error('❌ [BET] Error updating UI after bet placement:', error);
      return false;
    }
  };

  // Function to handle odds selection for betting
  const handleOddsClick = (market: BettingMarket, selection: any, type: 'back' | 'lay') => {
    if (!user) {
      console.log('❌ [BET] User not authenticated, cannot place bet');
      return;
    }

    const betData: BetSlipData = {
      matchId: cleanMatchId,
      marketId: market.marketId || market.id,
      selectionId: selection.id,
      selectionName: selection.name,
      odds: selection.odds,
      type: type,
      marketName: market.name
    };

    console.log('🔍 [BET] Odds clicked, opening bet slip:', betData);
    setSelectedBet(betData);
    setBetSlipOpen(true);
  };
  


  // Clean the match ID - remove any extra characters like (1.246615310)
  const cleanMatchId = (params.id as string)?.split('(')[0] || '';

  // Clean the URL if it contains extra characters
  useEffect(() => {
    if (params.id && (params.id as string).includes('(')) {
      const newUrl = `/app/match/${cleanMatchId}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [params.id]);

  // Debug log when odds data changes
  useEffect(() => {
    if (oddsData) {
      console.log('🔍 [DEBUG] Odds data state updated:', {
        marketsCount: oddsData.markets?.length || 0,
        lastUpdated: oddsData.lastUpdated
      });
      
      if (oddsData.markets && oddsData.markets.length > 0) {
        console.log('🔍 [DEBUG] Analyzing all markets for gstatus values...');
        
        oddsData.markets.forEach((market, marketIndex) => {
          console.log(`🔍 [DEBUG] Market ${marketIndex + 1}: ${market.name}`, {
            selectionsCount: market.selections?.length || 0,
            marketStatus: market.status
          });
          
          if (market.selections && market.selections.length > 0) {
            market.selections.forEach((selection, selectionIndex) => {
              if (selectionIndex < 5) { // Log first 5 selections to avoid spam
                console.log(`🔍 [DEBUG] Market ${marketIndex + 1}, Selection ${selectionIndex + 1}: ${selection.name}`, {
                  gstatus: selection.gstatus,
                  status: selection.status,
                  type: selection.type,
                  odds: selection.odds
                });
              }
            });
            
            // Count gstatus values for this market
            const gstatusCounts: { [key: string]: number } = {};
            market.selections.forEach(selection => {
              const gstatus = selection.gstatus || 'UNDEFINED';
              gstatusCounts[gstatus] = (gstatusCounts[gstatus] || 0) + 1;
            });
            console.log(`🔍 [DEBUG] Market ${marketIndex + 1} gstatus distribution:`, gstatusCounts);
          }
        });
      }
    }
  }, [oddsData]);

  // Use optimized match updates hook (prevents page refresh)
  const {
    isConnected: isWebSocketConnected,
    isUpdating,
    lastUpdate,
    updateCount,
    getUpdateIndicatorStyles,
    getLastUpdateText
  } = useOptimizedMatchUpdates({
    matchId: cleanMatchId,
    onOddsUpdate: (data) => {
      console.log('🔄 [OPTIMIZED] Odds update received:', data);
      
      // Debug log to see the structure of odds data
      if (data && data.data && data.data.markets) {
        console.log('🔍 [DEBUG] Odds data structure:', {
          marketsCount: data.data.markets.length,
          firstMarket: data.data.markets[0] ? {
            name: data.data.markets[0].name,
            selectionsCount: data.data.markets[0].selections?.length || 0
          } : null
        });
        
        // Check first selection for gstatus
        if (data.data.markets[0] && data.data.markets[0].selections && data.data.markets[0].selections.length > 0) {
          const firstSelection = data.data.markets[0].selections[0];
          console.log('🔍 [DEBUG] First selection gstatus:', {
            name: firstSelection.name,
            gstatus: firstSelection.gstatus,
            status: firstSelection.status
          });
        }
      }
      
      setOddsData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          lastUpdated: new Date().toISOString(),
          markets: data.data?.markets || prevData.markets
        };
      });
    },
    onFancyUpdate: (data) => {
      console.log('🔄 [OPTIMIZED] Fancy update received:', data);
    },
    onScoreUpdate: (data) => {
      console.log('🔄 [OPTIMIZED] Score update received:', data);
    },
    onStatusUpdate: (data) => {
      console.log('🔄 [OPTIMIZED] Status update received:', data);
    },
    onMarketUpdate: (data) => {
      console.log('🔄 [OPTIMIZED] Market update received:', data);
    }
  });

  // Helper function to determine match status from fixture data
  const getMatchStatus = (fixture: any): string => {
    if (fixture.iplay === true) {
      return 'INPLAY';
    }
    
    let startTime: Date | null = null;
    if (fixture.stime) {
      try {
        if (typeof fixture.stime === 'string') {
          startTime = new Date(fixture.stime);
          
          if (isNaN(startTime.getTime())) {
            const parts = fixture.stime.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)\s+(AM|PM)/);
            if (parts) {
              const [_, month, day, year, hour, minute, second, ampm] = parts;
              let hour24 = parseInt(hour);
              if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
              if (ampm === 'AM' && hour24 === 12) hour24 = 0;
              startTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
            }
          }
        }
      } catch (error) {
        console.error('Error parsing fixture start time:', error);
        startTime = null;
      }
    }
    
    if (!startTime || isNaN(startTime.getTime())) {
      return 'UPCOMING';
    }
    
    const now = new Date();
    
    if (startTime > now) {
      return 'UPCOMING';
    }
    
    if (startTime <= now && startTime > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
      return fixture.iplay === true ? 'INPLAY' : 'FINISHED';
    }
    
    return 'FINISHED';
  };

  // Fetch match data from API
  useEffect(() => {
    const fetchMatchData = async () => {
      if (!cleanMatchId) {
        setError('Invalid match ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch real fixture data from the API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/provider/cricketmatches`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const fixtures = await response.json();
        const matchFixture = fixtures.find((fixture: any) => 
          fixture.eventId === cleanMatchId || 
          fixture.id === cleanMatchId ||
          fixture.matchId === cleanMatchId
        );
        
        if (matchFixture) {
          const matchData: InPlayMatch = {
            id: matchFixture.id || matchFixture.eventId || matchFixture.matchId,
            matchId: matchFixture.eventId || matchFixture.id || matchFixture.matchId,
            matchName: matchFixture.eventName || matchFixture.name || `Match ${cleanMatchId}`,
            tournament: matchFixture.tournament || matchFixture.cname || 'Cricket Match',
            date: matchFixture.date || new Date().toLocaleDateString(),
            time: matchFixture.time || new Date().toLocaleTimeString(),
            status: getMatchStatus(matchFixture),
            cd: matchFixture.team1 || matchFixture.brunners?.[0] || 'Team 1',
            team2: matchFixture.team2 || matchFixture.brunners?.[1] || 'Team 2',
            score1: matchFixture.score1 || '0-0',
            score2: matchFixture.score2 || '0-0',
            isLive: matchFixture.iplay === true || matchFixture.inPlay === true,
            startTime: matchFixture.startTime || matchFixture.stime || null
          };
          
          setMatch(matchData);
          console.log('✅ [MATCH] Match data loaded:', matchData);
        } else {
          console.warn('⚠️ [MATCH] No fixture found for match ID:', cleanMatchId);
          // Create a placeholder match
          const placeholderMatch: InPlayMatch = {
            id: cleanMatchId,
            matchId: cleanMatchId,
            matchName: `Match ${cleanMatchId}`,
            tournament: 'Cricket Match',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            status: 'UPCOMING',
            team1: 'Team 1',
            team2: 'Team 2',
            score1: '0-0',
            score2: '0-0',
            isLive: false,
            startTime: null
          };
          setMatch(placeholderMatch);
        }
      } catch (error) {
        console.error('❌ [MATCH] Error fetching match data:', error);
        setError('Failed to fetch match data');
      } finally {
        setLoading(false);
      }
    };

    if (cleanMatchId) {
      fetchMatchData();
    }
  }, [cleanMatchId]);

  // Fetch scorecard data
  useEffect(() => {
    const fetchScorecard = async () => {
      if (!cleanMatchId || !match?.isLive) return;

      try {
        const scorecardData = await scorecardService.getScorecard(cleanMatchId);
        setScorecard(scorecardData);
      } catch (error) {
        console.error('❌ [SCORECARD] Error fetching scorecard:', error);
      }
    };

    if (match?.isLive) {
      fetchScorecard();
      const interval = setInterval(fetchScorecard, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [cleanMatchId, match?.isLive]);

  // Fetch live TV stream
  useEffect(() => {
    const fetchStream = async () => {
      if (!cleanMatchId || !match?.isLive) return;

      try {
        const streamData = await liveTVService.getLiveStream(cleanMatchId);
        if (streamData && streamData.streamUrl) {
          setStreamUrl(streamData.streamUrl);
        }
      } catch (error) {
        console.error('❌ [STREAM] Error fetching stream:', error);
        setStreamError('Failed to load stream');
      }
    };

    if (match?.isLive) {
      fetchStream();
    }
  }, [cleanMatchId, match?.isLive]);

  // Fetch initial odds data
  useEffect(() => {
    const fetchOdds = async () => {
      if (!cleanMatchId) return;

      try {
        console.log('🔍 [ODDS] Fetching odds for match:', cleanMatchId);
        const oddsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/odds/${cleanMatchId}`);
        
        console.log('🔍 [ODDS] Response status:', oddsResponse.status);
        console.log('🔍 [ODDS] Response headers:', Object.fromEntries(oddsResponse.headers.entries()));
        
        if (oddsResponse.ok) {
          const oddsData = await oddsResponse.json();
          console.log('✅ [ODDS] Initial odds data loaded:', oddsData);
          
          if (oddsData && oddsData.markets && oddsData.markets.length > 0) {
            console.log('✅ [ODDS] Found markets:', oddsData.markets.length);
            setOddsData(oddsData);
          } else {
            console.warn('⚠️ [ODDS] No markets found in response:', oddsData);
            setOddsData(null);
          }
        } else {
          const errorText = await oddsResponse.text();
          console.error('❌ [ODDS] API error:', oddsResponse.status, errorText);
          setOddsData(null);
        }
      } catch (error) {
        console.error('❌ [ODDS] Network error fetching odds:', error);
        setOddsData(null);
      }
    };

    fetchOdds();
  }, [cleanMatchId]);

  // Get user chips on component mount


  // Extract team names from match data
  const team1Name = match?.team1 || 'Team 1';
  const team2Name = match?.team2 || 'Team 2';

  // Function to open bet slip
  const openBetSlip = (market: any, selection: any, type: 'back' | 'lay') => {
    if (!user) {
      alert('Please login to place bets');
      return;
    }

    const betData: BetSlipData = {
      marketId: market.id,
      selectionId: selection.id,
      selectionName: selection.name,
      odds: selection.odds,
      type: type,
      marketName: market.name,
      matchId: cleanMatchId,
      stake: 100 // Default stake
    };

    setSelectedBet(betData);
    setBetSlipOpen(true);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading match details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Match</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-gray-600 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Match Not Found</h1>
            <p className="text-gray-600 mb-4">The requested match could not be found.</p>
            <button
              onClick={() => router.push('/app/matches')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      


      {/* WebSocket Connection Status */}
      {!isWebSocketConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg mx-2 mt-1 p-2 flex items-start space-x-2">
          <div className="flex-shrink-0">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">WebSocket Connection Lost</h3>
            <p className="text-sm text-yellow-700">Real-time updates are currently unavailable. The page will automatically reconnect when the connection is restored.</p>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Main Content Area - Independently Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Match Header */}
          <div className="bg-white border-b border-gray-200 py-1 px-2 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{match.matchName || 'Loading...'}</h1>
                  <p className="text-sm text-gray-600">
                    {match.tournament && `${match.tournament} • `}{match.date} {match.time}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-sm font-medium">{match.status}</div>
                  <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm font-medium">ID: {match.matchId}</div>
                </div>
              </div>
            </div>
          </div>

                    

          {/* Scoreboard */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between text-white">
                {/* Left Team */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-300">
                      {scorecard?.data?.spnnation1 || team1Name?.substring(0, 2)?.toUpperCase() || 'T1'}
                    </div>
                    <div className="text-sm opacity-90 text-gray-200">
                      {team1Name || 'Team 1'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {scorecard?.data?.score1 || '0-0'}
                    </div>
                    <div className="text-sm opacity-75 text-gray-300">
                      RR: {scorecard?.data?.spnrunrate1 || '0.00'}
                    </div>
                  </div>
                </div>

                {/* Center - Match Status & Current Over */}
                <div className="text-center flex-1 mx-4">
                  <div className="text-2xl font-bold text-white mb-1">
                    {scorecard?.data?.spnmessage || 'Match Status'}
                  </div>
                  <div className="text-base opacity-90 text-gray-200 mb-2">
                    {scorecard?.data?.activenation2 === '1' ? team2Name : team1Name} Batting • 
                    RR: {scorecard?.data?.activenation2 === '1' ? scorecard?.data?.spnrunrate2 : scorecard?.data?.spnrunrate1 || '0.00'}
                  </div>
                  
                  {/* Current Over Balls */}
                  <div className="flex justify-center gap-1 mb-1">
                    {scorecard?.data?.balls?.slice(0, 6).map((ball: string, index: number) => (
                      <div 
                        key={index} 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          ball === 'W' ? 'bg-red-500' : 
                          ball === '4' ? 'bg-green-500' : 
                          ball === '6' ? 'bg-purple-500' : 
                          ball === '1' ? 'bg-blue-500' :
                          ball === '2' ? 'bg-blue-600' :
                          ball === '0' ? 'bg-gray-600' :
                          ball === '-' ? 'bg-gray-500' : 'bg-blue-400'
                        }`}
                      >
                        {ball}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs opacity-75 text-gray-300">
                    Current Over • {scorecard?.data?.activenation2 === '1' ? team2Name : team1Name} batting
                  </div>
                </div>

                {/* Right Team */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {scorecard?.data?.score2 || '0-0'}
                    </div>
                    <div className="text-sm opacity-75 text-gray-300">
                      RR: {scorecard?.data?.spnrunrate2 || '0.00'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">
                      {scorecard?.data?.spnnation2 || team2Name?.substring(0, 2)?.toUpperCase() || 'T2'}
                    </div>
                    <div className="text-sm opacity-90 text-gray-200">
                      {team2Name || 'Team 2'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Odds Section */}
          <div className="p-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Betting Markets</h2>
              
              {oddsData && oddsData.markets && oddsData.markets.length > 0 ? (
                <div className="space-y-4">
                  {oddsData.markets.map((market, marketIndex) => (
                    <div key={market.id || marketIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {/* Market Header */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{market.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Min: {market.minStake?.toLocaleString() || '100'} | 
                              Max: {market.maxStake?.toLocaleString() || '500K'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Market Content - Table Layout */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                                Selection
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b border-gray-200">
                                Back Odds
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b border-gray-200">
                                Lay Odds
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {market.selections && market.selections.length > 0 ? (
                              // Group selections by name to show back/lay side by side
                              Object.entries(
                                market.selections.reduce((acc: any, selection) => {
                                  const key = selection.name;
                                  if (!acc[key]) {
                                    acc[key] = { back: null, lay: null };
                                  }
                                  if (selection.type === 'back') {
                                    acc[key].back = selection;
                                  } else if (selection.type === 'lay') {
                                    acc[key].lay = selection;
                                  }
                                  return acc;
                                }, {})
                              ).map(([selectionName, selections]: [string, any], rowIndex) => (
                                <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
                                  {/* Selection Name */}
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {selectionName}
                                  </td>
                                  
                                  {/* Back Odds */}
                                  <td className="px-4 py-3 text-center">
                                    {selections.back ? (
                                                                             <div 
                                         className="inline-block p-2 rounded cursor-pointer transition-colors bg-green-100 border border-green-300 hover:bg-green-200 cursor-pointer"
                                         onClick={() => openBetSlip(market, selections.back, 'back')}
                                       >
                                        <div className="text-lg font-bold text-green-700">
                                          {selections.back.odds}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {selections.back.stake?.toLocaleString() || '0'}
                                        </div>
                                        
                                        
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-sm">-</span>
                                    )}
                                  </td>
                                  
                                  {/* Lay Odds */}
                                  <td className="px-4 py-3 text-center">
                                    {selections.lay ? (
                                                                             <div 
                                         className="inline-block p-2 rounded cursor-pointer transition-colors bg-pink-100 border border-pink-300 hover:bg-pink-200 cursor-pointer"
                                         onClick={() => openBetSlip(market, selections.lay, 'lay')}
                                       >
                                        <div className="text-lg font-bold text-pink-700">
                                          {selections.lay.odds}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {selections.lay.stake?.toLocaleString() || '0'}
                                        </div>
                                        
                                        
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-sm">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                                  No selections available for this market.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">No Markets Available</h3>
                        <p className="text-sm text-gray-600">No betting markets are currently available for this match</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            console.log('🔄 [ODDS] Retrying odds fetch...');
                            const oddsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/odds/${cleanMatchId}`);
                            if (oddsResponse.ok) {
                              const oddsData = await oddsResponse.json();
                              if (oddsData && oddsData.markets && oddsData.markets.length > 0) {
                                setOddsData(oddsData);
                                console.log('✅ [ODDS] Retry successful, found markets:', oddsData.markets.length);
                              }
                            } else {
                              console.error('❌ [ODDS] Retry failed with status:', oddsResponse.status);
                            }
                          } catch (error) {
                            console.error('❌ [ODDS] Retry error:', error);
                          }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        🔄 Retry
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-center text-gray-500">
                      <p className="mb-4">No odds data available. This could be due to:</p>
                      <ul className="text-sm text-left max-w-md mx-auto space-y-1">
                        <li>• Match not yet started</li>
                        <li>• Odds temporarily unavailable</li>
                        <li>• API connection issue</li>
                      </ul>
                      <p className="mt-4 text-xs">Check browser console for detailed error information.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Live Feed & Bet Slip */}
        <div className={`${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 fixed lg:relative inset-y-0 right-0 z-40 w-96 bg-white shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out`}>
          <div className="h-full flex flex-col">
            
            {/* Live Feed Section */}
            <div className="flex-shrink-0">
              <div className="bg-gray-600 p-2 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Live Feed</h3>
                  <button
                    onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                    className="lg:hidden text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-2">
                {/* Live Stream */}
                {streamUrl ? (
                  <div className="mb-2">
                    <HLSVideoPlayer
                      src={streamUrl}
                      eventId={cleanMatchId}
                      className="w-full aspect-video rounded-lg"
                      onError={(error) => setStreamError(error)}
                      onLoad={() => setStreamError(null)}
                    />
                  </div>
                ) : streamError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center mb-2">
                    <div className="text-red-600 text-sm mb-1">Stream Unavailable</div>
                    <div className="text-red-500 text-xs">{streamError}</div>
                  </div>
                ) : (
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center mb-2">
                    <div className="text-gray-600 text-sm">Loading stream...</div>
                  </div>
                )}

                {/* Stream Info */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${streamUrl ? 'text-green-600' : 'text-gray-500'}`}>
                      {streamUrl ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event ID:</span>
                    <span className="text-gray-800 font-medium">{cleanMatchId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="text-blue-600 font-medium">
                      {streamUrl ? 'Live TV' : 'Streaming'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bet Slip Section */}
            <div className="flex-shrink-0 border-t border-gray-200">
              <div className="bg-blue-600 p-2 text-white">
                <h2 className="text-base font-bold">Bet Slip</h2>
              </div>
              
              <div className="p-2">
                                 <BetSlip
                   bet={selectedBet}
                   onConfirm={handleBetConfirm}
                   onClose={() => setSelectedBet(null)}
                   userBalance={user?.creditLimit || 0}
                   isLoading={false}
                 />
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}