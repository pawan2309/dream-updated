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
import { BackOddsBox, LayOddsBox } from '../../../../components/OddsBox';
import SuspendedOverlay from '../../../../components/SuspendedOverlay';
import BetSlip from '../../../../components/BetSlip';
import { useBetPlacement } from '../../../../lib/hooks/useBetPlacement';

interface MatchDetailsPageProps {}

interface Bet {
  marketId: string;
  selectionId: string;
  selectionName: string;
  odds: number;
  stake: number;
  type: 'back' | 'lay';
  marketName: string;
}

interface BetSlipData {
  marketId: string;
  selectionId: string;
  selectionName: string;
  odds: number;
  type: 'back' | 'lay';
  marketName: string;
  stake?: number;
}

export default function MatchDetailsPage({}: MatchDetailsPageProps) {
  const params = useParams();
  const router = useRouter();
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
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(true);
  
  // Bet placement state
  const [selectedBet, setSelectedBet] = useState<BetSlipData | null>(null);
  const [betSlipOpen, setBetSlipOpen] = useState(false); // Added missing state
  
  // Use bet placement hook
  const {
    bets: placedBets,
    isLoading: betLoading,
    error: betError,
    userChips, // Changed from userBalance to userChips
    userExposure, // Added userExposure
    placeBet,
    updateBetStatus,
    getUserChips, // Changed from getUserBalance to getUserChips
    clearError
  } = useBetPlacement();

  // Clean the match ID - remove any extra characters like (1.246615310)
  const cleanMatchId = (params.id as string)?.split('(')[0] || '';

  // Clean the URL if it contains extra characters
  useEffect(() => {
    if (params.id && (params.id as string).includes('(')) {
      const newUrl = `/app/match/${cleanMatchId}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [params.id]);



  // Helper function to determine match status from fixture data
  const getMatchStatus = (fixture: any): string => {
    // First priority: if match is live (iplay = true), show INPLAY
    if (fixture.iplay === true) {
      return 'INPLAY';
    }
    
    // Parse the start time properly
    let startTime: Date | null = null;
    if (fixture.stime) {
      try {
        // Handle different date formats from API
        if (typeof fixture.stime === 'string') {
          // Try parsing as is first
          startTime = new Date(fixture.stime);
          
          // If invalid, try parsing with different formats
          if (isNaN(startTime.getTime())) {
            // Try parsing as MM/DD/YYYY HH:MM:SS AM/PM format
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
    
    // If start time is in the future, match is upcoming
    if (startTime > now) {
      return 'UPCOMING';
    }
    
    // If start time is in the past but within last 24 hours
    if (startTime <= now && startTime > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
      // Check if match is still live or finished
      return fixture.iplay === true ? 'INPLAY' : 'FINISHED';
    }
    
    // If start time is more than 24 hours ago, match is finished
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
        const response = await fetch(`http://localhost:4001/provider/cricketmatches`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const fixturesData = await response.json();
        
        // Find the specific match by beventId
        const fixture = fixturesData.find((f: any) => 
          f.beventId === cleanMatchId || f.id === cleanMatchId || f.gmid === cleanMatchId
        );
        
        if (!fixture) {
          setError('Match not found');
          setLoading(false);
          return;
        }
        
                 // Debug: Log fixture data for status determination
         console.log('🔍 [DEBUG] Fixture data for status:', {
           beventId: fixture.beventId,
           ename: fixture.ename,
           iplay: fixture.iplay,
           stime: fixture.stime,
           status: fixture.status,
           gscode: fixture.gscode
         });
         
         const matchStatus = getMatchStatus(fixture);
         console.log('🔍 [DEBUG] Determined match status:', matchStatus);
         
         // Transform the API data to match our interface
         const transformedMatch: InPlayMatch = {
           id: fixture.beventId || fixture.id,
           matchId: fixture.beventId || fixture.id,
           matchName: fixture.ename || 'Unknown Match',
           tournament: fixture.cname || 'Unknown Tournament',
           date: fixture.stime ? new Date(fixture.stime).toLocaleDateString() : '',
           time: fixture.stime ? new Date(fixture.stime).toLocaleTimeString() : '',
           venue: '',
           sport: 'Cricket',
           matchStatus: fixture.iplay ? 'LIVE' : 'UPCOMING',
           status: matchStatus,
           isLive: fixture.iplay || false,
           lastUpdate: Date.now(),
          liveScore: {
            homeScore: "",
            awayScore: "",
            overs: "",
            runRate: "",
            requiredRunRate: ""
          },
          liveOdds: {
            home: 0,
            away: 0,
            draw: 0,
            lastUpdated: Date.now()
          }
        };
        
        setMatch(transformedMatch);
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError('Failed to load match details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [cleanMatchId]);

  // Fetch odds data
  useEffect(() => {
    const fetchOddsData = async () => {
      if (!cleanMatchId) return;

      try {
        const result = await oddsService.getMatchOdds(cleanMatchId);
        if (result.success && result.data) {
          setOddsData(result.data);
        }
      } catch (error) {
        console.error('Error fetching odds:', error);
      }
    };

    fetchOddsData();
    // Refresh odds every 3 seconds
    const interval = setInterval(fetchOddsData, 3000);
    return () => clearInterval(interval);
  }, [cleanMatchId]);

  // Fetch scorecard data
  useEffect(() => {
    const fetchScorecard = async () => {
      if (!cleanMatchId) return;

      try {
        const result = await scorecardService.getScorecard(cleanMatchId);
        if (result.success && result.data) {
          setScorecard(result.data);
        }
      } catch (error) {
        console.error('Error fetching scorecard:', error);
      }
    };

    fetchScorecard();
    // Refresh scorecard every 10 seconds
    const interval = setInterval(fetchScorecard, 3000);
    return () => clearInterval(interval);
  }, [cleanMatchId]);

  // Fetch live stream URL
  useEffect(() => {
    const fetchStreamUrl = async () => {
      if (!cleanMatchId) return;

      try {
        const result = await liveTVService.getLiveStream(cleanMatchId);
        if (result.success && result.data) {
          setStreamUrl(result.data.streamUrl);
        }
      } catch (error) {
        console.error('Error fetching stream URL:', error);
      }
    };

    fetchStreamUrl();
  }, [cleanMatchId]);

  // WebSocket real-time updates for odds
  useEffect(() => {
    if (!cleanMatchId) return;

    // Subscribe to odds updates for this specific match
    const unsubscribeOdds = websocketService.subscribe('odds_update', (update) => {
      if (update.matchId === cleanMatchId) {
        console.log('🔄 [WEBSOCKET] Odds update received for match:', cleanMatchId, update);
        
        // Update odds data with new information
        setOddsData(prevData => {
          if (!prevData) return prevData;
          
          // Merge the updated odds data
          return {
            ...prevData,
            lastUpdated: new Date().toISOString(),
            markets: update.data?.markets || prevData.markets
          };
        });
      }
    });

    // Subscribe to match updates
    const unsubscribeMatch = websocketService.subscribe('match_update', (update) => {
      if (update.matchId === cleanMatchId) {
        console.log('🔄 [WEBSOCKET] Match update received for match:', cleanMatchId, update);
      }
    });

    // Subscribe to the specific match
    websocketService.subscribeToMatch(cleanMatchId);

    // Cleanup subscriptions
    return () => {
      unsubscribeOdds();
      unsubscribeMatch();
      websocketService.unsubscribeFromMatch(cleanMatchId);
    };
  }, [cleanMatchId]);

  // Fetch user chips on component mount
  useEffect(() => {
    getUserChips();
  }, [getUserChips]);

  // Use all matches without filtering


  // Open bet slip for bet placement
  const openBetSlip = (market: BettingMarket, selection: any, type: 'back' | 'lay') => {
    const betData: BetSlipData = {
      marketId: market.id,
      selectionId: selection.id,
      selectionName: selection.name,
      odds: selection.odds,
      type: type,
      marketName: market.name
    };
    
    setSelectedBet(betData);
    setBetSlipOpen(true);
  };

  // Handle bet confirmation
  const handleBetConfirm = async (stake: number): Promise<boolean> => {
    if (!selectedBet) return false;
    
    const betData = {
      ...selectedBet,
      stake
    };
    
    const success = await placeBet(betData, stake);
    if (success) {
      // Add to local bets array for display
      const newBet: Bet = {
        ...selectedBet,
        stake,
        marketId: selectedBet.marketId,
        selectionId: selectedBet.selectionId,
        selectionName: selectedBet.selectionName,
        odds: selectedBet.odds,
        type: selectedBet.type,
        marketName: selectedBet.marketName
      };
      setBets([...bets, newBet]);
    }
    return success;
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

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Match</h1>
            <p className="text-gray-600 mb-4">{error || 'Match not found'}</p>
            <button
              onClick={() => router.push('/app/inplay')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract team names from match data - handle both " vs " and " v " formats properly
  let team1Name = '';
  let team2Name = '';
  
  // Try " vs " format first
  if (match.matchName.includes(' vs ')) {
    const parts = match.matchName.split(' vs ');
    team1Name = parts[0] || '';
    team2Name = parts[1] || '';
  }
  // If no " vs " found, try " v " format
  else if (match.matchName.includes(' v ')) {
    const parts = match.matchName.split(' v ');
    team1Name = parts[0] || '';
    team2Name = parts[1] || '';
  }
  // If neither format found, set as single team
  else {
    team1Name = match.matchName;
    team2Name = '';
  }

  return (
    <div className="min-h-dvh bg-gray-80 relative pt-[60px]">
      <Header />
      

      
      {/* WebSocket Connection Warning */}
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

      <div className="flex">


        {/* Main Content Area */}
        <div className="flex-1">
                     {/* Match Header */}
           <div className="bg-white border-b border-gray-200 py-1 px-2">
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
              
              {/* Match Progress Bar */}
              {scorecard?.data?.spnreqrate2 && (
                <div className="mt-3 text-center">
                  <div className="text-sm text-gray-300 mb-1">
                    Required Run Rate: {scorecard.data.spnreqrate2}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Betting Markets */}
          <div className="max-w-6xl mx-auto p-2">
            
          
            
            {/* Dynamic Markets Display - Shows ALL available markets from API */}
            <div className="space-y-3">
              {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1"></div>
                    <p className="text-sm">Loading odds data...</p>
                  </div>
                </div>
              ) : oddsData?.markets && oddsData.markets.length > 0 ? (
                oddsData.markets.map((market, marketIndex) => {
                  // Group selections by name and type
                  const groupedSelections: Record<string, { back: any[]; lay: any[] }> = {};
                  market.selections?.forEach(selection => {
                    const baseName = selection.name;
                    if (!groupedSelections[baseName]) {
                      groupedSelections[baseName] = { back: [], lay: [] };
                    }
                    if (selection.type === 'back') {
                      groupedSelections[baseName].back.push(selection);
                    } else if (selection.type === 'lay') {
                      groupedSelections[baseName].lay.push(selection);
                    }
                  });
                  
                  // Sort back odds (best first) and lay odds (best first)
                  Object.values(groupedSelections).forEach(group => {
                    group.back.sort((a, b) => a.odds - b.odds);
                    group.lay.sort((a, b) => b.odds - a.odds);
                  });

                  // Determine market type for styling
                  const isMainMarket = market.id === 'match_odds' || market.id === 'bookmaker';
                  const isTiedMarket = market.id === 'tied_match';
                  const isFancyMarket = market.id === 'normal' || market.id === 'fancy1';
                  
                  return (
                    <div key={market.id || marketIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {/* Market Title */}
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{market.name}</h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Min: {market.minStake?.toLocaleString() || '100'} | 
                              Max: {market.maxStake?.toLocaleString() || '500K'}
                            </p>
                          </div>
                          <button className="px-3 py-1 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 transition-colors" disabled>
                            Cashout
                          </button>
                        </div>
                      </div>
                      
                      {/* Market Content */}
                      <div className="overflow-x-auto">
                        {Object.keys(groupedSelections).length > 0 ? (
                          <table className="w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                                  Selection
                                </th>
                                {isMainMarket ? (
                                  <>
                                    <th className="px-2 py-2 text-center text-sm font-medium text-gray-700 border-b border-gray-200">
                                      <div className="flex flex-col space-y-0.5">
                                        <span className="text-blue-600 font-semibold">Back</span>
                                        <div className="flex space-x-1 justify-center">
                                          <span className="text-xs text-gray-500">2</span>
                                          <span className="text-xs text-gray-500">1</span>
                                          <span className="text-xs text-gray-500">Best</span>
                                        </div>
                                      </div>
                                    </th>
                                    <th className="px-2 py-2 text-center text-sm font-medium text-gray-700 border-b border-gray-200">
                                      <div className="flex flex-col space-y-0.5">
                                        <span className="text-pink-600 font-semibold">Lay</span>
                                        <div className="flex space-x-1 justify-center">
                                          <span className="text-xs text-gray-500">Best</span>
                                          <span className="text-xs text-gray-500">1</span>
                                          <span className="text-xs text-gray-500">2</span>
                                        </div>
                                      </div>
                                    </th>
                                  </>
                                ) : (
                                  <>
                                    <th className="px-2 py-2 text-center text-sm font-medium text-gray-700 border-b border-gray-200">
                                      <span className="text-pink-600 font-semibold">No</span>
                                    </th>
                                    <th className="px-2 py-2 text-center text-sm font-medium text-gray-700 border-b border-gray-200">
                                      <span className="text-blue-600 font-semibold">Yes</span>
                                    </th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {Object.entries(groupedSelections).map(([name, selections], index) => (
                                <tr key={name} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-2 border-b border-gray-200">
                                    <div className="flex items-center">
                                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={name}>
                                        {name}
                                      </div>
                                    </div>
                                  </td>
                                  
                                  {isMainMarket ? (
                                    <>
                                      {/* Back Odds Column */}
                                      <td className="px-2 py-2 border-b border-gray-200">
                                        <div className="flex space-x-2 justify-center">
                                          {/* Back2 */}
                                          {selections.back.length >= 3 ? (
                                            <BackOddsBox
                                              value={selections.back[2].odds}
                                              volume={selections.back[2].stake}
                                              onClick={() => openBetSlip(market, selections.back[2], 'back')}
                                              tier={2}
                                            />
                                          ) : (
                                            <div className="w-20 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                              <span className="text-gray-400 text-sm">-</span>
                                            </div>
                                          )}
                                          
                                          {/* Back1 */}
                                          {selections.back.length >= 2 ? (
                                            <BackOddsBox
                                              value={selections.back[1].odds}
                                              volume={selections.back[1].stake}
                                              onClick={() => openBetSlip(market, selections.back[1], 'back')}
                                              tier={1}
                                            />
                                          ) : (
                                            <div className="w-20 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                              <span className="text-gray-400 text-sm">-</span>
                                            </div>
                                          )}
                                          
                                          {/* Back (Best) */}
                                          {selections.back.length >= 1 ? (
                                            <BackOddsBox
                                              value={selections.back[0].odds}
                                              volume={selections.back[0].stake}
                                              onClick={() => openBetSlip(market, selections.back[0], 'back')}
                                              tier={0}
                                            />
                                          ) : (
                                            <div className="w-20 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                              <span className="text-gray-400 text-sm">-</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      
                                      {/* Lay Odds Column */}
                                      <td className="px-2 py-2 border-b border-gray-200">
                                        <div className="flex space-x-2 justify-center">
                                          {/* Lay (Best) */}
                                          {selections.lay.length >= 1 ? (
                                            <LayOddsBox
                                              value={selections.lay[0].odds}
                                              volume={selections.lay[0].stake}
                                              onClick={() => openBetSlip(market, selections.lay[0], 'lay')}
                                              tier={0}
                                            />
                                          ) : (
                                            <div className="w-20 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                              <span className="text-gray-400 text-sm">-</span>
                                            </div>
                                          )}
                                          
                                          {/* Lay1 */}
                                          {selections.lay.length >= 2 ? (
                                            <LayOddsBox
                                              value={selections.lay[1].odds}
                                              volume={selections.lay[1].stake}
                                              onClick={() => openBetSlip(market, selections.lay[1], 'lay')}
                                              tier={1}
                                            />
                                          ) : (
                                            <div className="w-20 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                              <span className="text-gray-400 text-sm">-</span>
                                            </div>
                                          )}
                                          
                                          {/* Lay2 */}
                                          {selections.lay.length >= 3 ? (
                                            <LayOddsBox
                                              value={selections.lay[2].odds}
                                              volume={selections.lay[2].stake}
                                              onClick={() => openBetSlip(market, selections.lay[2], 'lay')}
                                              tier={2}
                                            />
                                          ) : (
                                            <div className="w-20 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                              <span className="text-gray-400 text-sm">-</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      {/* Lay (No) */}
                                      <td className="px-2 py-2 border-b border-gray-200">
                                        <div className="flex justify-center">
                                          {selections.lay.length >= 1 ? (
                                            <LayOddsBox
                                              value={selections.lay[0].odds}
                                              volume={selections.lay[0].stake}
                                              onClick={() => openBetSlip(market, selections.lay[0], 'lay')}
                                            />
                                          ) : (
                                            <div className="w-20 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                              <span className="text-gray-400 text-sm">-</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      
                                      {/* Back (Yes) */}
                                      <td className="px-2 py-2 border-b border-gray-200">
                                        <div className="flex justify-center">
                                          {selections.back.length >= 1 ? (
                                            <BackOddsBox
                                              value={selections.back[0].odds}
                                              volume={selections.back[0].stake}
                                              onClick={() => openBetSlip(market, selections.back[0], 'back')}
                                            />
                                          ) : (
                                            <div className="w-20 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                              <span className="text-gray-400 text-sm">-</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No selections available for this market</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Market Remarks - Removed hardcoded text */}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">No Markets Available</h3>
                        <p className="text-sm text-gray-600">No betting markets are currently available for this match</p>
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
          </div>
        </div>

        {/* Right Sidebar - Live Feed & Bet Slip */}
        <div className={`${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 right-0 z-40 w-96 bg-white shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out`}>
          <div className="h-full overflow-y-auto">
            
            {/* Live Feed Section - Now at the top */}
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

            {/* Bet Slip Section - Now below Live Feed */}
            <div className="border-t border-gray-200">
              <div className="bg-blue-600 p-2 text-white">
                <h2 className="text-base font-bold">Bet Slip</h2>
              </div>
              
              <div className="p-2">
                <BetSlip
                  bet={selectedBet}
                  onConfirm={handleBetConfirm}
                  onClose={() => setSelectedBet(null)}
                  userBalance={userChips}
                  isLoading={betLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {betError && (
        <div className="fixed top-20 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{betError}</span>
            <button
              onClick={clearError}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

