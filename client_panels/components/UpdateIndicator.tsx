import React from 'react';

interface UpdateIndicatorProps {
  isUpdating: boolean;
  lastUpdate: Date | null;
  updateCount: number;
  isConnected: boolean;
  className?: string;
}

export default function UpdateIndicator({
  isUpdating,
  lastUpdate,
  updateCount,
  isConnected,
  className = ''
}: UpdateIndicatorProps) {
  const getLastUpdateText = () => {
    if (!lastUpdate) return 'No updates yet';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const getConnectionStatusColor = () => {
    if (!isConnected) return 'text-red-500';
    return 'text-green-500';
  };

  const getConnectionStatusIcon = () => {
    if (!isConnected) return '🔴';
    return '🟢';
  };

  return (
    <div className={`flex items-center space-x-3 text-xs text-gray-600 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        <span className="text-sm">{getConnectionStatusIcon()}</span>
        <span className={getConnectionStatusColor()}>
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Update Indicator */}
      {isUpdating && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-blue-600">Updating...</span>
        </div>
      )}

      {/* Last Update Time */}
      <div className="flex items-center space-x-1">
        <span className="text-gray-400">•</span>
        <span>Updated {getLastUpdateText()}</span>
      </div>

      {/* Update Count */}
      <div className="flex items-center space-x-1">
        <span className="text-gray-400">•</span>
        <span>{updateCount} updates</span>
      </div>
    </div>
  );
}

// Mini version for compact display
export function MiniUpdateIndicator({
  isUpdating,
  isConnected,
  className = ''
}: Pick<UpdateIndicatorProps, 'isUpdating' | 'isConnected' | 'className'>) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection Status */}
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      
      {/* Update Indicator */}
      {isUpdating && (
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
}
