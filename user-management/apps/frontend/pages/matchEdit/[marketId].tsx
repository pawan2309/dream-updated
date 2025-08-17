import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface MatchData {
  matchName: string;
  seriesName: string;
  scoreIframe: string;
  scoreIframe2: string;
  eventId: string;
  seriesId: string;
  sportId: string;
  marketId: string;
  priority: string;
  matchDate: string;
  tvId: string;
  socketUrl: string;
  cacheUrl: string;
  otherMarketCacheUrl: string;
  tvUrl: string;
  matchType: string;
  status: string;
  betDelayTime: string;
  bookmakerRange: string;
  team1Img: string;
  team2Img: string;
  notification: string;
}

interface BetSettings {
  maxBookmakerBet: string;
  maxFancyBet: string;
  maxTieCoins: string;
  maxMatchOddsCoins: string;
  minCoins: string;
  minBookmakerBet: string;
  minFancyBet: string;
  maxCompletedCoins: string;
  maxTossCoins: string;
}

interface BetDelays {
  tieBetDelay: string;
  bookmakerBetDelay: string;
  tossBetDelay: string;
  completedBetDelay: string;
  matchOddsBetDelay: string;
}

interface Permissions {
  isTv: boolean;
  isScore: boolean;
  betPerm: boolean;
  socketPerm: boolean;
  isBookmaker: boolean;
  isFancy: boolean;
  isMatchOdds: boolean;
  isTieOdds: boolean;
  isToss: boolean;
  isCompletedOdds: boolean;
  isLineMarketOdds: boolean;
}

export default function MatchEditPage() {
  const router = useRouter();
  const { marketId } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [matchData, setMatchData] = useState<MatchData>({
    matchName: '',
    seriesName: '',
    scoreIframe: '',
    scoreIframe2: '',
    eventId: '',
    seriesId: '',
    sportId: '',
    marketId: '',
    priority: '',
    matchDate: '',
    tvId: '',
    socketUrl: '',
    cacheUrl: '',
    otherMarketCacheUrl: '',
    tvUrl: '',
    matchType: '',
    status: '',
    betDelayTime: '',
    bookmakerRange: '',
    team1Img: '',
    team2Img: '',
    notification: ''
  });

  const [betSettings, setBetSettings] = useState<BetSettings>({
    maxBookmakerBet: '',
    maxFancyBet: '',
    maxTieCoins: '',
    maxMatchOddsCoins: '',
    minCoins: '',
    minBookmakerBet: '',
    minFancyBet: '',
    maxCompletedCoins: '',
    maxTossCoins: ''
  });

  const [betDelays, setBetDelays] = useState<BetDelays>({
    tieBetDelay: '',
    bookmakerBetDelay: '',
    tossBetDelay: '',
    completedBetDelay: '',
    matchOddsBetDelay: ''
  });

  const [permissions, setPermissions] = useState<Permissions>({
    isTv: true,
    isScore: true,
    betPerm: true,
    socketPerm: true,
    isBookmaker: true,
    isFancy: true,
    isMatchOdds: true,
    isTieOdds: true,
    isToss: true,
    isCompletedOdds: true,
    isLineMarketOdds: true
  });

  const [wonTeamName, setWonTeamName] = useState('');

  useEffect(() => {
    if (!marketId) return;
    
    const fetchMatchData = async () => {
      try {
        setFetching(true);
        // TODO: Replace with actual API endpoint
        // const res = await fetch(`/api/matches/${marketId}`);
        // const data = await res.json();
        
        // For now, using mock data
        setMatchData({
          matchName: 'Mysore Warriors v Shivamogga Lions',
          seriesName: 'Maharaja Trophy KSCA T20',
          scoreIframe: 'https://score.trovetown.co/socket-iframe-5/crickexpo/34616847',
          scoreIframe2: 'https://card.hr08bets.in/ap/getScoreData?event_id=34616847',
          eventId: '34616847',
          seriesId: '12752374',
          sportId: '4',
          marketId: '1.246617681',
          priority: '',
          matchDate: '17-08-2025 19:15:00',
          tvId: '',
          socketUrl: 'https://vigcache.trovetown.co/',
          cacheUrl: 'https://vigcache.trovetown.co/v2/api/oddsDataNew?market_id=1.246617681',
          otherMarketCacheUrl: 'https://vigcache.trovetown.co/v2/api/dataByEventId?eventId=34616847',
          tvUrl: 'https://cache.bpexchanges.com/embed?eventId=34616847',
          matchType: 'T-20',
          status: 'INPLAY',
          betDelayTime: '',
          bookmakerRange: '',
          team1Img: '',
          team2Img: '',
          notification: ''
        });

        setBetSettings({
          maxBookmakerBet: '200000',
          maxFancyBet: '50000',
          maxTieCoins: '200000',
          maxMatchOddsCoins: '200000',
          minCoins: '0',
          minBookmakerBet: '100',
          minFancyBet: '100',
          maxCompletedCoins: '200000',
          maxTossCoins: '50000'
        });

        setBetDelays({
          tieBetDelay: '0',
          bookmakerBetDelay: '0',
          tossBetDelay: '0',
          completedBetDelay: '0',
          matchOddsBetDelay: '1'
        });
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError('Failed to fetch match details');
      } finally {
        setFetching(false);
      }
    };

    fetchMatchData();
  }, [marketId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMatchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBetSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBetSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBetDelaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBetDelays(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (permission: keyof Permissions) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual API call
      console.log('Submitting match data:', { matchData, betSettings, betDelays, permissions });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Match updated successfully!');
      setTimeout(() => {
        router.push('/matches');
      }, 1500);
    } catch (err) {
      console.error('Error updating match:', err);
      setError('Failed to update match');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <div className="bg-blue-800 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Update Match</h1>
            <button
              onClick={() => router.back()}
              className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-b-lg shadow-lg">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded m-4">
                {success}
              </div>
            )}

            {/* Section 1: Match Details */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Match Details</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Match Name</label>
                    <input
                      type="text"
                      name="matchName"
                      value={matchData.matchName}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Score Iframe</label>
                    <input
                      type="text"
                      name="scoreIframe"
                      value={matchData.scoreIframe}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Event ID</label>
                    <input
                      type="text"
                      name="eventId"
                      value={matchData.eventId}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Sport ID</label>
                    <input
                      type="text"
                      name="sportId"
                      value={matchData.sportId}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <input
                      type="text"
                      name="priority"
                      value={matchData.priority}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">TV ID</label>
                    <input
                      type="text"
                      name="tvId"
                      value={matchData.tvId}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Cache URL</label>
                    <input
                      type="text"
                      name="cacheUrl"
                      value={matchData.cacheUrl}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">TV URL</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                      >
                        Set URL
                      </button>
                      <input
                        type="text"
                        name="tvUrl"
                        value={matchData.tvUrl}
                        onChange={handleInputChange}
                        className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={matchData.status}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="INPLAY">Inplay</option>
                      <option value="ABONDED">Abandoned</option>
                      <option value="REMOVE">Remove</option>
                      <option value="CANCEL">Cancel</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="UPCOMING">Upcoming</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Bookmaker Range</label>
                    <input
                      type="text"
                      name="bookmakerRange"
                      value={matchData.bookmakerRange}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Team 2 Image</label>
                    <div className="flex space-x-2 items-start">
                      <input
                        type="file"
                        name="team2Img"
                        className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <img
                        alt="team2Img"
                        className="h-16 w-32 rounded border border-gray-300"
                        src={matchData.team2Img || '/placeholder-team.png'}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Series Name</label>
                    <input
                      type="text"
                      name="seriesName"
                      value={matchData.seriesName}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Score Iframe 2</label>
                    <input
                      type="text"
                      name="scoreIframe2"
                      value={matchData.scoreIframe2}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Series ID</label>
                    <input
                      type="text"
                      name="seriesId"
                      value={matchData.seriesId}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Market ID</label>
                    <input
                      type="text"
                      name="marketId"
                      value={matchData.marketId}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Match Date</label>
                    <input
                      type="text"
                      name="matchDate"
                      value={matchData.matchDate}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Socket URL</label>
                    <input
                      type="text"
                      name="socketUrl"
                      value={matchData.socketUrl}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Other Market Cache URL</label>
                    <input
                      type="text"
                      name="otherMarketCacheUrl"
                      value={matchData.otherMarketCacheUrl}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Match Type</label>
                    <select
                      name="matchType"
                      value={matchData.matchType}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Match Type</option>
                      <option value="One-Day">One Day</option>
                      <option value="T-20">T 20</option>
                      <option value="T-10">T 10</option>
                      <option value="Test">Test</option>
                      <option value="Cup">Cup</option>
                      <option value="20-20 OR 50-50">SA20</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Bet Delay Time</label>
                    <input
                      type="text"
                      name="betDelayTime"
                      value={matchData.betDelayTime}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Team 1 Image</label>
                    <div className="flex space-x-2 items-start">
                      <input
                        type="file"
                        name="team1Img"
                        className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <img
                        alt="team1Img"
                        className="h-16 w-32 rounded border border-gray-300"
                        src={matchData.team1Img || '/placeholder-team.png'}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Notification</label>
                    <input
                      type="text"
                      name="notification"
                      value={matchData.notification}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Settings & Permissions */}
            <div className="p-6 border-b border-gray-200">
              {/* Bet Stake Setting */}
              <div className="mb-6">
                <div className="bg-blue-800 text-white px-4 py-3 rounded-lg flex justify-between items-center mb-4">
                  <span className="font-medium">Bet Stake Setting</span>
                  <button type="button" className="text-white hover:text-gray-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Max Bookmaker Bet</label>
                      <input
                        type="text"
                        name="maxBookmakerBet"
                        value={betSettings.maxBookmakerBet}
                        onChange={handleBetSettingsChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Max Fancy Bet</label>
                      <input
                        type="text"
                        name="maxFancyBet"
                        value={betSettings.maxFancyBet}
                        onChange={handleBetSettingsChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Max Tie Coins</label>
                      <input
                        type="text"
                        name="maxTieCoins"
                        value={betSettings.maxTieCoins}
                        onChange={handleBetSettingsChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Max Match Odds Coins</label>
                      <input
                        type="text"
                        name="maxMatchOddsCoins"
                        value={betSettings.maxMatchOddsCoins}
                        onChange={handleBetSettingsChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Min Coins</label>
                      <input
                        type="text"
                        name="minCoins"
                        value={betSettings.minCoins}
                        onChange={handleBetSettingsChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Min Bookmaker Bet</label>
                      <input
                        type="text"
                        name="minBookmakerBet"
                        value={betSettings.minBookmakerBet}
                        onChange={handleBetSettingsChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Min Fancy Bet</label>
                      <input
                        type="text"
                        name="minFancyBet"
                        value={betSettings.minFancyBet}
                        onChange={handleBetSettingsChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Max Completed Coins</label>
                      <input
                        type="text"
                        name="maxCompletedCoins"
                        value={betSettings.maxCompletedCoins}
                        onChange={handleBetSettingsChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Max Toss Coins</label>
                      <input
                        type="text"
                        name="maxTossCoins"
                        value={betSettings.maxTossCoins}
                        onChange={handleBetSettingsChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bet Delay Setting */}
              <div className="mb-6">
                <div className="bg-blue-800 text-white px-4 py-3 rounded-lg flex justify-between items-center mb-4">
                  <span className="font-medium">Bet Delay Setting</span>
                  <button type="button" className="text-white hover:text-gray-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Tie Bet Delay</label>
                      <input
                        type="text"
                        name="tieBetDelay"
                        value={betDelays.tieBetDelay}
                        onChange={handleBetDelaysChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Bookmaker Bet Delay</label>
                      <input
                        type="text"
                        name="bookmakerBetDelay"
                        value={betDelays.bookmakerBetDelay}
                        onChange={handleBetDelaysChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Toss Bet Delay</label>
                      <input
                        type="text"
                        name="tossBetDelay"
                        value={betDelays.tossBetDelay}
                        onChange={handleBetDelaysChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Completed Bet Delay</label>
                      <input
                        type="text"
                        name="completedBetDelay"
                        value={betDelays.completedBetDelay}
                        onChange={handleBetDelaysChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Match Odds Bet Delay</label>
                      <input
                        type="text"
                        name="matchOddsBetDelay"
                        value={betDelays.matchOddsBetDelay}
                        onChange={handleBetDelaysChange}
                        className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Permissions</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">TV Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('isTv')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.isTv ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.isTv ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Bet Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('betPerm')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.betPerm ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.betPerm ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Bookmaker Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('isBookmaker')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.isBookmaker ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.isBookmaker ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Match Odds Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('isMatchOdds')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.isMatchOdds ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.isMatchOdds ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Toss Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('isToss')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.isToss ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.isToss ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Line Market Odds Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('isLineMarketOdds')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.isLineMarketOdds ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.isLineMarketOdds ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Score Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('isScore')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.isScore ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.isScore ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Socket Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('socketPerm')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.socketPerm ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.socketPerm ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Fancy Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('isFancy')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.isFancy ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.isFancy ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Tie Odds Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('isTieOdds')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.isTieOdds ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.isTieOdds ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Completed Odds Permission</label>
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle('isCompletedOdds')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions.isCompletedOdds ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.isCompletedOdds ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium text-sm"
                  >
                    Clear Exposer
                  </button>
                  <button
                    type="button"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium text-sm"
                  >
                    Update BetFair Market
                  </button>
                  <button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium text-sm"
                  >
                    Check Duplicate Fancy
                  </button>
                  <button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm"
                  >
                    Check Duplicate Exposuer Fancy
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium text-sm disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Section 3: Other Market */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Won Team Name</label>
                  <input
                    type="text"
                    value={wonTeamName}
                    onChange={(e) => setWonTeamName(e.target.value)}
                    disabled
                    className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Other Market</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-800 text-white">
                        <th className="text-center p-3">BetFair Market ID</th>
                        <th className="text-center p-3">Market Type</th>
                        <th className="text-center p-3">Match Name</th>
                        <th className="text-center p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Empty state - will be populated with actual data */}
                      <tr>
                        <td colSpan={4} className="text-center p-4 text-gray-500">
                          No other markets found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-800 text-white">
                        <th className="text-center p-3">Team Name</th>
                        <th className="text-center p-3">Selection ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Empty state - will be populated with actual data */}
                      <tr>
                        <td colSpan={2} className="text-center p-4 text-gray-500">
                          No team selections found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
