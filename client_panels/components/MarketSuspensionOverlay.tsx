import React from 'react';
import { MarketStatus } from '../lib/hooks/useMarketStatus';

interface MarketSuspensionOverlayProps {
  marketStatus: MarketStatus | null;
  isVisible: boolean;
  className?: string;
}

export default function MarketSuspensionOverlay({ 
  marketStatus, 
  isVisible, 
  className = '' 
}: MarketSuspensionOverlayProps) {
  if (!isVisible || !marketStatus) return null;

  const isSuspended = marketStatus.marketStatus === 'SUSPENDED' || marketStatus.matchStatus === 'SUSPENDED';
  const isClosed = marketStatus.marketStatus === 'CLOSED' || marketStatus.matchStatus === 'CLOSED';

  if (!isSuspended && !isClosed) return null;

  const getOverlayContent = () => {
    if (isClosed) {
      return {
        icon: '🔒',
        title: 'Market Closed',
        message: 'This market is no longer accepting bets',
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        borderColor: 'border-red-600'
      };
    }

    if (isSuspended) {
      return {
        icon: '⚠️',
        title: 'Market Suspended',
        message: marketStatus.suspensionReason || 'Betting is temporarily suspended',
        bgColor: 'bg-yellow-500',
        textColor: 'text-white',
        borderColor: 'border-yellow-600'
      };
    }

    return null;
  };

  const content = getOverlayContent();
  if (!content) return null;

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center ${className}`}>
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg" />
      
      {/* Suspension message */}
      <div className={`relative ${content.bgColor} ${content.textColor} px-6 py-8 rounded-lg shadow-2xl border-2 ${content.borderColor} max-w-sm mx-4 text-center`}>
        {/* Icon */}
        <div className="text-4xl mb-4">
          {content.icon}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold mb-2">
          {content.title}
        </h3>
        
        {/* Message */}
        <p className="text-sm opacity-90 mb-4">
          {content.message}
        </p>
        
        {/* Status indicator */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white bg-opacity-20 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
          {marketStatus.marketStatus === 'SUSPENDED' ? 'SUSPENDED' : marketStatus.matchStatus}
        </div>
        
        {/* Timestamp if available */}
        {marketStatus.suspendedAt && (
          <div className="mt-3 text-xs opacity-75">
            Suspended at: {new Date(marketStatus.suspendedAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
