import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InPlayMatch } from '../lib/hooks/useInPlayMatches';

interface LiveMatchCardProps {
  match: InPlayMatch;
  onAction?: (action: string, matchId: string) => void;
  showActions?: boolean;
  className?: string;
}

export const LiveMatchCard: React.FC<LiveMatchCardProps> = ({
  match,
  onAction,
  showActions = false,
  className = ''
}) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);

  // Update time since last update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSinceUpdate(Date.now() - match.lastUpdate);
    }, 1000);

    return () => clearInterval(interval);
  }, [match.lastUpdate]);

  const formatTimeSinceUpdate = (milliseconds: number) => {
    if (milliseconds < 60000) return `${Math.floor(milliseconds / 1000)}s ago`;
    if (milliseconds < 3600000) return `${Math.floor(milliseconds / 60000)}m ago`;
    return `${Math.floor(milliseconds / 3600000)}h ago`;
  };

  const getStatusColor = (status: string, isLive: boolean) => {
    if (isLive && status === 'LIVE') return 'bg-green-100 text-green-800 border-green-500';
    if (status === 'BREAK') return 'bg-yellow-100 text-yellow-800 border-yellow-500';
    if (status === 'INTERVAL') return 'bg-blue-100 text-blue-800 border-blue-500';
    if (status === 'FINISHED' || status === 'COMPLETED') return 'bg-gray-100 text-gray-800 border-gray-500';
    if (status === 'UPCOMING') return 'bg-blue-100 text-blue-800 border-blue-500';
    if (status === 'INPLAY') return 'bg-green-100 text-green-800 border-green-500';
    return 'bg-gray-100 text-gray-800 border-gray-500';
  };

  const getStatusText = (status: string, isLive: boolean) => {
    if (isLive && status === 'INPLAY') return 'LIVE';
    if (status === 'INPLAY') return 'LIVE';
    return status;
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date} ${time}`);
      return dateTime.toLocaleString();
    } catch {
      return `${date} ${time}`;
    }
  };

  const formatOdds = (odds: number) => {
    return odds.toFixed(2);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 border-green-500 p-4 transition-all duration-200 hover:shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-lg leading-tight">{match.matchName}</h3>
          <p className="text-sm text-gray-600 mt-1">{match.tournament}</p>
          <p className="text-xs text-gray-500 mt-1">Match ID: {match.matchId || match.id}</p>
          {match.venue && (
            <p className="text-xs text-gray-500">Venue: {match.venue}</p>
          )}
        </div>
        
        <div className="text-right ml-4">
          <span className={`inline-block px-3 py-1 text-sm rounded-full border ${getStatusColor(match.matchStatus, match.isLive)}`}>
            {getStatusText(match.matchStatus, match.isLive)}
          </span>
          <p className="text-sm text-gray-600 mt-2">
            {formatDateTime(match.date, match.time)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Updated: {formatTimeSinceUpdate(timeSinceUpdate)}
          </p>
        </div>
      </div>

      {/* Live Score Section */}
      {match.liveScore && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Live Score</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-600">Home</p>
              <p className="text-lg font-bold text-gray-800">{match.liveScore.homeScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Away</p>
              <p className="text-lg font-bold text-gray-800">{match.liveScore.awayScore}</p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-700">
              Overs: {match.liveScore.overs} | RR: {match.liveScore.runRate}
            </p>
            {match.liveScore.requiredRunRate && (
              <p className="text-sm text-gray-600">
                Required RR: {match.liveScore.requiredRunRate}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Live Odds Section */}
      {match.liveOdds && (
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <h4 className="text-sm font-medium text-blue-700 mb-2">Live Odds</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-blue-600">Home</p>
              <p className="text-lg font-bold text-blue-800">{formatOdds(match.liveOdds.home)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600">Away</p>
              <p className="text-lg font-bold text-blue-800">{formatOdds(match.liveOdds.away)}</p>
            </div>
          </div>
          {match.liveOdds.draw && (
            <div className="mt-2 text-center">
              <p className="text-xs text-blue-600">Draw</p>
              <p className="text-lg font-bold text-blue-800">{formatOdds(match.liveOdds.draw)}</p>
            </div>
          )}
          <p className="text-xs text-blue-600 text-center mt-2">
            Last updated: {new Date(match.liveOdds.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      )}

             {/* Match Details */}
       <div className="mb-3">
         <p className="text-sm text-gray-500">Sport: {match.sport || 'Cricket'}</p>
       </div>

      {/* Actions */}
      {showActions && onAction && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={() => router.push(`/app/match/${match.id}`)}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => onAction('bet', match.id)}
            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Place Bet
          </button>
        </div>
      )}

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
      >
        {isExpanded ? 'Show Less' : 'Show More'}
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>External ID: {match.externalId || match.id}</p>
            <p>Game ID: {match.gameId || match.id}</p>
            <p>Title: {match.title || match.matchName}</p>
            <p>Last Update: {new Date(match.lastUpdate).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
