import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface GameLayoutProps {
  children: ReactNode;
  gameName: string;
  gameType: string;
  streamingId: string;
  className?: string;
}

export function GameLayout({ 
  children, 
  gameName, 
  gameType, 
  streamingId, 
  className = '' 
}: GameLayoutProps) {
  const router = useRouter();

  const handleBackToCasino = () => {
    router.push('/app/casino');
  };

  return (
    <div className={`min-h-dvh bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative ${className}`}>
      {/* Game Header */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Back Button */}
            <button
              onClick={handleBackToCasino}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-400 hover:to-indigo-500 transition-all duration-300 text-sm"
            >
              ← Back to Casino
            </button>
            
            {/* Game Info */}
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">{gameName}</h1>
              <p className="text-sm text-gray-600">Game ID: {streamingId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default GameLayout;
