import React from 'react';
import { InPlayMatch } from '../lib/hooks/useInPlayMatches';
import { useRouter } from 'next/navigation';

interface LiveMatchListProps {
  matches: InPlayMatch[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
}

export const LiveMatchList: React.FC<LiveMatchListProps> = ({
  matches,
  loading = false,
  error = null,
  emptyMessage = 'No in-play matches available at the moment. Check back later for live matches.',
  className = ''
}) => {
  const router = useRouter();

  // Sort matches: Live matches first, then by date/time in ascending order
  const sortedMatches = [...matches].sort((a, b) => {
    // Live matches first
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    
    // Then sort by date/time
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const handleMatchClick = (matchId: string) => {
    router.push(`/app/match/${matchId}`);
  };

  const getStatusColor = (status: string, isLive: boolean) => {
    if (isLive && status === 'LIVE') return 'bg-green-100 text-green-800';
    if (status === 'LIVE' || status === 'INPLAY') return 'bg-green-100 text-green-800';
    if (status === 'BREAK') return 'bg-yellow-100 text-yellow-800';
    if (status === 'INTERVAL') return 'bg-blue-100 text-blue-800';
    if (status === 'FINISHED' || status === 'COMPLETED') return 'bg-gray-100 text-gray-800';
    if (status === 'UPCOMING' || status === 'SCHEDULED' || status === 'OPEN') return 'bg-blue-100 text-blue-800';
    if (status === 'POSTPONED' || status === 'CANCELLED') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string, isLive: boolean) => {
    // Handle live matches first
    if (isLive && (status === 'INPLAY' || status === 'LIVE')) return 'LIVE';
    if (status === 'INPLAY' || status === 'LIVE') return 'LIVE';
    
    // Handle other statuses
    if (status === 'UPCOMING' || status === 'OPEN') return 'UPCOMING';
    if (status === 'SCHEDULED') return 'SCHEDULED';
    if (status === 'FINISHED' || status === 'COMPLETED') return 'FINISHED';
    if (status === 'BREAK') return 'BREAK';
    if (status === 'INTERVAL') return 'INTERVAL';
    if (status === 'POSTPONED') return 'POSTPONED';
    if (status === 'CANCELLED') return 'CANCELLED';
    
    // Default fallback - convert to title case for better display
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date} ${time}`);
      return dateTime.toLocaleString();
    } catch {
      return `${date} ${time}`;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${className}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Series</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 mt-2"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading in-play matches</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No in-play matches</h3>
          <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Series</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMatches.map((match) => {
              // Debug: Log the match data being rendered
              console.log('🔍 Rendering Match:', {
                id: match.id,
                matchStatus: match.matchStatus,
                isLive: match.isLive,
                status: match.status
              });
              
              return (
                <tr 
                  key={match.id} 
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${match.isLive ? 'bg-green-50' : ''}`}
                  onClick={() => handleMatchClick(match.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {match.isLive && (
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {match.matchName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {match.venue && `Venue: ${match.venue}`}
                        </div>
                        {match.liveScore && (
                          <div className="text-xs text-gray-600 mt-1">
                            {match.liveScore.homeScore} vs {match.liveScore.awayScore} ({match.liveScore.overs})
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{match.tournament}</div>
                    <div className="text-xs text-gray-500">ID: {match.matchId || match.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDateTime(match.date, match.time)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(match.matchStatus, match.isLive)}`}>
                      {getStatusText(match.matchStatus, match.isLive)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
