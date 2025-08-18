import React from 'react';
import { MarketStatus } from '../lib/hooks/useMarketStatus';

interface SuspendedBettingButtonProps {
  marketStatus: MarketStatus | null;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  showSuspensionIndicator?: boolean;
}

export default function SuspendedBettingButton({ 
  marketStatus, 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  showSuspensionIndicator = true
}: SuspendedBettingButtonProps) {
  const isSuspended = marketStatus?.marketStatus === 'SUSPENDED' || marketStatus?.matchStatus === 'SUSPENDED';
  const isClosed = marketStatus?.marketStatus === 'CLOSED' || marketStatus?.matchStatus === 'CLOSED';
  const isDisabled = disabled || isSuspended || isClosed;

  const getButtonStyles = () => {
    if (isDisabled) {
      if (isSuspended) {
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 cursor-not-allowed opacity-75';
      }
      if (isClosed) {
        return 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed opacity-75';
      }
      return 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed opacity-75';
    }
    
    return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 cursor-pointer';
  };

  const getSuspensionText = () => {
    if (isSuspended) {
      return marketStatus?.suspensionReason || 'SUSPENDED';
    }
    if (isClosed) {
      return 'CLOSED';
    }
    return '';
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2 ${getButtonStyles()} ${className}`}
      >
        {children}
      </button>
      
      {/* Suspension indicator */}
      {showSuspensionIndicator && isDisabled && (
        <div className="absolute -top-2 -right-2">
          <div className={`
            px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg
            ${isSuspended ? 'bg-yellow-500' : 'bg-red-500'}
          `}>
            {getSuspensionText()}
          </div>
        </div>
      )}
      
      {/* Tooltip on hover for suspended/closed buttons */}
      {isDisabled && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {getSuspensionText()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
