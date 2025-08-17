import React from 'react';

interface OddsBoxProps {
  type: 'back' | 'lay';
  value: number;
  volume: number;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  tier?: number; // For Back1, Back2, Lay1, Lay2
  status?: 'active' | 'suspended' | 'settled';
  ballRunning?: boolean;
}

export default function OddsBox({ 
  type, 
  value, 
  volume, 
  onClick, 
  disabled = false,
  className = '',
  tier,
  status = 'active',
  ballRunning = false
}: OddsBoxProps) {
  const baseStyles = `
    px-3 py-1.5 
    rounded 
    font-bold 
    transition-all 
    duration-200 
    cursor-pointer 
    border 
    min-w-[80px]
    text-center
    relative
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
  `;

  // Different styling for each tier
  let typeStyles = '';
  if (type === 'back') {
    if (tier === 2) {
      typeStyles = 'bg-blue-25 text-blue-700 border-blue-150 hover:bg-blue-100 hover:border-blue-250';
    } else if (tier === 1) {
      typeStyles = 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300';
    } else {
      typeStyles = 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 hover:border-blue-400';
    }
  } else {
    if (tier === 2) {
      typeStyles = 'bg-pink-25 text-pink-700 border-pink-150 hover:bg-pink-100 hover:border-pink-250';
    } else if (tier === 1) {
      typeStyles = 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100 hover:border-pink-300';
    } else {
      typeStyles = 'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200 hover:border-pink-400';
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || status === 'suspended'}
      className={`${baseStyles} ${typeStyles} ${className}`}
    >
      <div className="flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-tight">
          {value.toFixed(2)}
        </span>
        <span className="text-xs text-gray-500 mt-0.5">
          ({volume.toLocaleString()})
        </span>
      </div>
      
      {/* Status Overlays */}
      {status === 'suspended' && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
          <span className="text-red-500 font-bold text-sm">SUSPENDED</span>
        </div>
      )}
      
      {ballRunning && status !== 'suspended' && (
        <div className="absolute inset-0 bg-yellow-500 bg-opacity-80 flex items-center justify-center rounded">
          <span className="text-black font-bold text-xs">Ball Running</span>
        </div>
      )}
    </button>
  );
}

// Specialized components for different tiers
export function BackOddsBox({ value, volume, onClick, disabled, tier = 0, status, ballRunning }: Omit<OddsBoxProps, 'type'>) {
  return (
    <OddsBox
      type="back"
      value={value}
      volume={volume}
      onClick={onClick}
      disabled={disabled}
      tier={tier}
      status={status}
      ballRunning={ballRunning}
    />
  );
}

export function LayOddsBox({ value, volume, onClick, disabled, tier = 0, status, ballRunning }: Omit<OddsBoxProps, 'type'>) {
  return (
    <OddsBox
      type="lay"
      value={value}
      volume={volume}
      onClick={onClick}
      disabled={disabled}
      tier={tier}
      status={status}
      ballRunning={ballRunning}
    />
  );
}
