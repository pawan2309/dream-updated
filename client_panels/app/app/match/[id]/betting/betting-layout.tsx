'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InPlayMatch } from '../../../../../lib/hooks/useInPlayMatches';
import Header from '../../../../../components/Header';
import { sharedApiService } from '../../../../../lib/sharedApi';
import { scorecardService, ScorecardData } from '../../../../../lib/scorecardService';
import { liveTVService } from '../../../../../lib/liveTVService';
import oddsService, { OddsData, BettingMarket } from '../../../../../lib/oddsService';
import HLSVideoPlayer from '../../../../../components/HLSVideoPlayer';
import { MarketCard, BetSlip, Bet } from '../../../../../components/BettingPage';

export default function BettingLayout() {
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
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [allMatches, setAllMatches] = useState<InPlayMatch[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'live' | 'upcoming'>('all');

  const cleanMatchId = (params.id as string)?.split('(')[0] || '';

  // Fetch all matches for left sidebar
  useEffect(() => {
    const fetchAllMatches = async () => {
      try {
        const result = await sharedApiService.getMatches();
        if (result.success && result.data) {
          // Transform Match[] to InPlayMatch[]
          const transformedMatches: InPlayMatch[] = result.data.map(match => ({
            id: match.id,
            matchId: match.matchId || match.id,
            matchName: match.matchName,
            tournament: match.tournament,
            date: match.date,
            time: match.time,
            venue: match.venue || 'TBD',
            sport: match.sport || 'Cricket',
            matchStatus: match.isLive ? 'LIVE' : 'FINISHED',
            status: match.status,
            isLive: match.isLive,
            lastUpdate: Date.now(),
            liveScore: {
              homeScore: "0-0",
              awayScore: "0-0",
              overs: "0.0",
              runRate: "0.00",
              requiredRunRate: "0.00"
            },
            liveOdds: {
              home: 1.0,
              away: 1.0,
              draw: 15.0,
              lastUpdated: Date.now()
            }
          }));
          setAllMatches(transformedMatches);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };
    fetchAllMatches();
  }, []);

  // Fetch match data
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
        
        const result = await sharedApiService.getMatchById(cleanMatchId);
        
        if (result.success && result.data) {
          const transformedMatch: InPlayMatch = {
            id: result.data.id,
            matchId: result.data.matchId || result.data.id,
            matchName: result.data.matchName,
            tournament: result.data.tournament,
            date: result.data.date,
            time: result.data.time,
            venue: result.data.venue || 'TBD',
            sport: result.data.sport || 'Cricket',
            matchStatus: result.data.isLive ? 'LIVE' : 'FINISHED',
            status: result.data.status,
            isLive: result.data.isLive,
            lastUpdate: Date.now(),
            liveScore: {
              homeScore: "0-0",
              awayScore: "0-0",
              overs: "0.0",
              runRate: "0.00",
              requiredRunRate: "0.00"
            },
            liveOdds: {
              home: 1.0,
              away: 1.0,
              draw: 15.0,
              lastUpdated: Date.now()
            }
          };
          
          setMatch(transformedMatch);
        } else {
          setError(result.error || 'Failed to fetch match details');
        }
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError('Failed to load match details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [cleanMatchId]);

  // Fetch scorecard data
  useEffect(() => {
    const fetchScorecardData = async () => {
      if (!cleanMatchId) return;

      try {
        const result = await scorecardService.getScorecard(cleanMatchId);
        
        if (result.success && result.data) {
          setScorecard(result.data);
        }
      } catch (err) {
        console.error('Error fetching scorecard data:', err);
      }
    };

    fetchScorecardData();
    const interval = setInterval(fetchScorecardData, 3000);
    return () => clearInterval(interval);
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
    const interval = setInterval(fetchOddsData, 3000);
    return () => clearInterval(interval);
  }, [cleanMatchId]);

  // Fetch stream URL
  useEffect(() => {
    const fetchStreamUrl = async () => {
      if (!cleanMatchId) return;

      try {
        const result = await liveTVService.getLiveStream(cleanMatchId);
        
        if (result.success && result.data) {
          setStreamUrl(result.data.streamUrl);
          setStreamError(null);
        } else {
          setStreamError(result.message || 'Failed to fetch stream');
        }
      } catch (err) {
        console.error('Error fetching stream URL:', err);
        setStreamError('Failed to load stream');
      }
    };

    fetchStreamUrl();
  }, [cleanMatchId]);

  // Add bet to bet slip
  const addBet = (market: BettingMarket, selection: any, type: 'back' | 'lay') => {
    const existingBetIndex = bets.findIndex(
      bet => bet.marketId === market.id && bet.selectionId === selection.id && bet.type === type
    );

    if (existingBetIndex >= 0) {
      setBets(bets.filter((_, index) => index !== existingBetIndex));
    } else {
      const newBet: Bet = {
        matchId: cleanMatchId,
        marketId: market.id,
        selectionId: selection.id,
        selectionName: selection.name,
        odds: selection.odds,
        stake: 0,
        type,
        marketName: market.name
      };
      setBets([...bets, newBet]);
    }
  };

  // Update bet stake
  const updateBetStake = (betIndex: number, newStake: number) => {
    const updatedBets = [...bets];
    updatedBets[betIndex].stake = newStake;
    setBets(updatedBets);
  };

  // Remove bet
  const removeBet = (betIndex: number) => {
    setBets(bets.filter((_, index) => index !== betIndex));
  };

  // Filter matches based on type
  const filteredMatches = allMatches.filter(match => {
    if (filterType === 'live') return match.isLive;
    if (filterType === 'upcoming') return !match.isLive;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-700 text-xl">Loading match details...</div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Error Loading Match</div>
          <div className="text-gray-600">{error || 'Match not found'}</div>
          <button 
            onClick={() => router.back()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const team1Name = 'Team 1';
  const team2Name = 'Team 2';
  const team1Abbr = scorecard?.team1?.abbreviation || 'T1';
  const team2Abbr = scorecard?.team2?.abbreviation || 'T2';

  return (
    <div className="min-h-dvh bg-gray-50 relative">
      <Header />
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-20 left-4 z-50">
        <button
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          className="bg-blue-600 text-white p-2 rounded-lg shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

              <div className="flex">
        {/* Left Sidebar - Matches List */}
        <div className={`${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out`}>
          <div className="h-full overflow-y-auto">
            {/* Sidebar Header */}
            <div className="bg-blue-600 p-4 text-white">
              <h2 className="text-lg font-bold">Matches</h2>
              <p className="text-sm opacity-90">Select a match to bet on</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { key: 'all', label: 'All', count: allMatches.length },
                { key: 'live', label: 'Live', count: allMatches.filter(m => m.isLive).length },
                { key: 'upcoming', label: 'Upcoming', count: allMatches.filter(m => !m.isLive).length }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as any)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    filterType === filter.key
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
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
              {filteredMatches.map((matchItem) => (
                <div
                  key={matchItem.id}
                  onClick={() => router.push(`/app/match/${matchItem.id}`)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    matchItem.id === cleanMatchId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {matchItem.matchName}
                    </span>
                    {matchItem.isLive && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {matchItem.tournament} • {matchItem.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0">
          {/* Match Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{match.matchName}</h1>
                  <p className="text-sm text-gray-600">{match.tournament} • {match.date} {match.time}</p>
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
                    <div className={`text-3xl font-bold ${scorecard?.team1?.isActive ? 'text-blue-300' : 'text-gray-400'}`}>
                      {scorecard?.team1?.abbreviation || team1Abbr}
                    </div>
                    <div className="text-sm opacity-90 text-gray-200">{team1Name}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {scorecard?.team1?.score || "0-0"}
                    </div>
                    <div className="text-sm opacity-75 text-gray-300">
                      RR: {scorecard?.team1?.runRate || "0.00"}
                    </div>
                  </div>
                </div>

                {/* Center - Current Over */}
                <div className="text-center flex-1 mx-8">
                  <div className="text-4xl font-bold text-white mb-2">
                    {scorecard?.team1?.isActive ? scorecard?.team1?.score : scorecard?.team2?.score || "0-0"}
                  </div>
                  <div className="text-lg opacity-90 text-gray-200 mb-3">
                    {scorecard?.team1?.isActive ? 
                      `Team 1 Batting • RR: ${scorecard?.team1?.runRate || "0.00"}` : 
                      `Team 2 Batting • RR: ${scorecard?.team2?.runRate || "0.00"}`
                    }
                  </div>
                  
                  {/* Current Over Balls */}
                  <div className="flex justify-center gap-2 mb-2">
                    {scorecard?.currentOver?.map((ball, index) => (
                      <div 
                        key={index} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          ball === 'W' || ball === 'w' ? 'bg-red-500' : 
                          ball === '4' ? 'bg-green-500' : 
                          ball === '6' ? 'bg-purple-500' : 
                          ball === '1' ? 'bg-blue-500' :
                          ball === '2' ? 'bg-blue-600' :
                          ball === '3' ? 'bg-blue-700' :
                          ball === '-' || ball === '0' ? 'bg-gray-500' : 'bg-gray-600'
                        }`}
                        title={`Ball ${index + 1}: ${ball}`}
                      >
                        {ball === 'W' || ball === 'w' ? 'W' : ball}
                      </div>
                    )) || Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        -
                      </div>
                    ))}
                  </div>
                  <div className="text-xs opacity-75 text-gray-300">
                    Current Over • {scorecard?.team1?.isActive ? `${team1Name} batting` : `${team2Name} batting`}
                  </div>
                </div>

                {/* Right Team */}
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {scorecard?.team2?.score || "0-0"}
                    </div>
                    <div className="text-sm opacity-75 text-gray-300">
                      RR: {scorecard?.team2?.runRate || "0.00"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${scorecard?.team2?.isActive ? 'text-green-300' : 'text-gray-400'}`}>
                      {scorecard?.team2?.abbreviation || team2Abbr}
                    </div>
                    <div className="text-sm opacity-90 text-gray-200">{team2Name}</div>
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
              {oddsData?.markets
                .filter(market => {
                  if (selectedMarket === 'over_runs') return market.type === 'over_runs';
                  if (selectedMarket === 'player_specials') return market.type === 'custom';
                  return market.id === selectedMarket;
                })
                .map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    onAddBet={addBet}
                    bets={bets}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Bet Slip & Live Feed */}
        <div className={`${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 right-0 z-40 w-96 bg-white shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out`}>
          <div className="h-full overflow-y-auto">
            {/* Sidebar Header */}
            <div className="bg-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Bet Slip</h2>
                <button
                  onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                  className="lg:hidden text-white hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bet Slip */}
            <BetSlip
              bets={bets}
              onUpdateStake={updateBetStake}
              onRemoveBet={removeBet}
            />

            {/* Live Feed Section */}
            <div className="border-t border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Feed</h3>
              
              {/* Live Stream */}
              {streamUrl ? (
                <div className="mb-4">
                  <HLSVideoPlayer
                    src={streamUrl}
                    eventId={cleanMatchId}
                    className="w-full aspect-video rounded-lg"
                    onError={(error) => setStreamError(error)}
                    onLoad={() => setStreamError(null)}
                  />
                </div>
              ) : streamError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mb-4">
                  <div className="text-red-600 text-sm mb-2">Stream Unavailable</div>
                  <div className="text-red-500 text-xs">{streamError}</div>
                </div>
              ) : (
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center mb-4">
                  <div className="text-gray-600 text-sm">Loading stream...</div>
                </div>
              )}

              {/* Stream Info */}
              <div className="space-y-2 text-sm">
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
                  <span className="text-blue-600 font-medium">Live TV</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isLeftSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}
    </div>
  );
}
