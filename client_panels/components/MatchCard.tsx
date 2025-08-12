import React from 'react';
import { Match } from '../lib/sharedApi';

interface MatchCardProps {
  match: Match;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onAction?: (action: string, matchId: string) => void;
  className?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  variant = 'default',
  showActions = false,
  onAction,
  className = ''
}) => {
  const getStatusColor = (status: string, isLive: boolean) => {
    if (isLive) return 'bg-green-100 text-green-800';
    if (status === 'UPCOMING') return 'bg-blue-100 text-blue-800';
    if (status === 'CLOSED') return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (status: string, isLive: boolean) => {
    if (isLive) return 'LIVE';
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

  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-3 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{match.matchName}</h3>
            <p className="text-sm text-gray-600">{match.tournament}</p>
          </div>
          <div className="text-right ml-4">
            <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(match.status, match.isLive)}`}>
              {getStatusText(match.status, match.isLive)}
            </span>
            <p className="text-xs text-gray-600 mt-1">
              {formatDateTime(match.date, match.time)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white rounded-lg shadow-md border-l-4 border-green-500 p-4 ${className}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg">{match.matchName}</h3>
            <p className="text-sm text-gray-600 mt-1">{match.tournament}</p>
            <p className="text-sm text-gray-500 mt-1">Match ID: {match.matchId}</p>
            <p className="text-sm text-gray-500">Sport: {match.sport}</p>
            
            {match.section && match.section.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Markets:</h4>
                <div className="space-y-1">
                  {match.section.slice(0, 3).map((section: any, index: number) => (
                    <div key={index} className="text-xs text-gray-600">
                      • {section.name || 'Market'}
                    </div>
                  ))}
                  {match.section.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{match.section.length - 3} more markets
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="text-right ml-4">
            <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusColor(match.status, match.isLive)}`}>
              {getStatusText(match.status, match.isLive)}
            </span>
            <p className="text-sm text-gray-600 mt-2">
              {formatDateTime(match.date, match.time)}
            </p>
            
            {showActions && onAction && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => onAction('view', match.id)}
                  className="w-full px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => onAction('bet', match.id)}
                  className="w-full px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Place Bet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 border-green-500 p-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{match.matchName}</h3>
          <p className="text-sm text-gray-600">{match.tournament}</p>
          <p className="text-xs text-gray-500 mt-1">Match ID: {match.matchId}</p>
          <p className="text-xs text-gray-500">Sport: {match.sport}</p>
        </div>
        
        <div className="text-right ml-4">
          <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(match.status, match.isLive)}`}>
            {getStatusText(match.status, match.isLive)}
          </span>
          <p className="text-sm text-gray-600 mt-1">
            {formatDateTime(match.date, match.time)}
          </p>
          
          {showActions && onAction && (
            <div className="mt-2 space-x-2">
              <button
                onClick={() => onAction('view', match.id)}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View
              </button>
              <button
                onClick={() => onAction('bet', match.id)}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Bet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 