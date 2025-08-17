import React from 'react';

interface GameStatusProps {
  roundId?: string;
  timeLeft?: number;
  gameStatus?: string;
  connectionStatus: 'loading' | 'connected' | 'error';
  isMobile?: boolean;
  isTablet?: boolean;
}

export function GameStatus({ 
  roundId, 
  timeLeft, 
  gameStatus, 
  connectionStatus, 
  isMobile = false, 
  isTablet = false 
}: GameStatusProps) {
  const gridCols = isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-4' : 'grid-cols-4';
  const gap = isMobile ? 'gap-2' : 'gap-4';

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'bg-yellow-400';
      case 'connected': return 'bg-green-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case 'loading': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`grid ${gridCols} ${gap} w-full ${isMobile ? 'mt-3' : ''}`}>
      <StatusItem 
        label="Round ID"
        value={roundId || 'Loading...'}
        className="text-gray-800"
      />
      
      <StatusItem 
        label="Next Round"
        value={`${timeLeft || 0}s`}
        className="text-red-600"
      />
      
      <StatusItem 
        label="Game Status"
        value={gameStatus || 'Waiting'}
        className="text-blue-600"
      />
      
      <StatusItem 
        label="Connection"
        value={getConnectionStatusText(connectionStatus)}
        className={connectionStatus === 'loading' ? 'text-yellow-600' : connectionStatus === 'error' ? 'text-red-600' : 'text-green-600'}
        showIndicator={true}
        indicatorColor={getConnectionStatusColor(connectionStatus)}
      />
    </div>
  );
}

interface StatusItemProps {
  label: string;
  value: string;
  className?: string;
  showIndicator?: boolean;
  indicatorColor?: string;
}

function StatusItem({ label, value, className = '', showIndicator = false, indicatorColor = '' }: StatusItemProps) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-600 font-medium">{label}</div>
      <div className={`text-lg font-bold ${className} flex items-center justify-center gap-1`}>
        {showIndicator && (
          <div className={`w-2 h-2 rounded-full ${indicatorColor}`}></div>
        )}
        <span>{value}</span>
      </div>
    </div>
  );
}

export default GameStatus;
