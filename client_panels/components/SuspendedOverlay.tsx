import React from 'react';

interface SuspendedOverlayProps {
  type: 'suspended' | 'ballRunning';
  isVisible: boolean;
  className?: string;
}

export default function SuspendedOverlay({ type, isVisible, className = '' }: SuspendedOverlayProps) {
  if (!isVisible) return null;

  const overlayStyles = `
    absolute inset-0 
    flex items-center justify-center 
    font-bold uppercase text-lg
    transition-all duration-300 ease-in-out
    pointer-events-none
    ${className}
  `;

  const getOverlayContent = () => {
    if (type === 'suspended') {
      return (
        <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          SUSPENDED
        </div>
      );
    } else if (type === 'ballRunning') {
      return (
        <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg">
          Ball Running
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`${overlayStyles} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {getOverlayContent()}
    </div>
  );
}
