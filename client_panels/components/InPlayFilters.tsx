import React from 'react';
import { MatchFilters } from '../lib/hooks/useInPlayMatches';

interface InPlayFiltersProps {
  filters: MatchFilters;
  onFiltersChange: (filters: Partial<MatchFilters>) => void;
  availableSports: string[];
  availableTournaments: string[];
  connectionStatus: boolean;
  lastUpdate: number;
  onRefresh: () => void;
}

export const InPlayFilters: React.FC<InPlayFiltersProps> = ({
  filters,
  onFiltersChange,
  availableSports,
  availableTournaments,
  connectionStatus,
  lastUpdate,
  onRefresh
}) => {
  const formatLastUpdate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search matches, tournaments..."
              value={filters.searchQuery || ''}
              onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sport Filter */}
          <div className="min-w-[150px]">
            <select
              value={filters.sport || ''}
              onChange={(e) => onFiltersChange({ sport: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Sports</option>
              {availableSports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          {/* Tournament Filter */}
          <div className="min-w-[200px]">
            <select
              value={filters.tournament || ''}
              onChange={(e) => onFiltersChange({ tournament: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Tournaments</option>
              {availableTournaments.map((tournament) => (
                <option key={tournament} value={tournament}>
                  {tournament}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status and Refresh */}
        <div className="flex items-center gap-4">
          {/* Live Only Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.showOnlyLive || false}
              onChange={(e) => onFiltersChange({ showOnlyLive: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Live Only</span>
          </label>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {connectionStatus ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Last Update */}
          <div className="text-sm text-gray-500">
            Updated: {formatLastUpdate(lastUpdate)}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={!connectionStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.sport || filters.tournament || filters.searchQuery) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {filters.sport && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Sport: {filters.sport}
                <button
                  onClick={() => onFiltersChange({ sport: undefined })}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.tournament && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Tournament: {filters.tournament}
                <button
                  onClick={() => onFiltersChange({ tournament: undefined })}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.searchQuery && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Search: "{filters.searchQuery}"
                <button
                  onClick={() => onFiltersChange({ searchQuery: undefined })}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
            
            <button
              onClick={() => onFiltersChange({ sport: undefined, tournament: undefined, searchQuery: undefined })}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
