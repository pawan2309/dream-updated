import React, { useState, useEffect } from 'react';

interface AndarBaharStreamProps {
  streamingId: string;
  jokerCard?: string;
  drawnCards: {
    andar: string[];
    bahar: string[];
  };
  gameStatus: 'waiting' | 'betting' | 'playing' | 'finished';
  winner?: 'andar' | 'bahar';
  onCardDrawn?: (side: 'andar' | 'bahar', card: string) => void;
}

export function AndarBaharStream({ 
  streamingId, 
  jokerCard, 
  drawnCards, 
  gameStatus, 
  winner,
  onCardDrawn 
}: AndarBaharStreamProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate stream loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getGameStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600';
      case 'betting': return 'text-green-600';
      case 'playing': return 'text-blue-600';
      case 'finished': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getGameStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Waiting for Players';
      case 'betting': return 'Betting Open';
      case 'playing': return 'Game in Progress';
      case 'finished': return 'Game Finished';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-8 shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full border-b-2 border-blue-600 w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game stream...</p>
        </div>
      </div>
    );
  }

  if (streamError) {
    return (
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-8 shadow-lg">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg font-semibold">Stream Error</p>
          <p className="text-sm">{streamError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg">
      {/* Stream Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
        <h3 className="text-lg font-semibold text-center">Andar Bahar Live Stream</h3>
        <div className="text-center text-sm opacity-90">
          Game ID: {streamingId}
        </div>
      </div>

      {/* Game Status */}
      <div className="p-4 border-b border-gray-200">
        <div className="text-center">
          <div className={`text-lg font-bold ${getGameStatusColor(gameStatus)}`}>
            {getGameStatusText(gameStatus)}
          </div>
        </div>
      </div>

      {/* Joker Card Section */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Joker Card</h4>
        <div className="flex justify-center">
          {jokerCard ? (
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl font-bold">{jokerCard}</div>
              <div className="text-sm text-center mt-2">JOKER</div>
            </div>
          ) : (
            <div className="bg-gray-200 text-gray-500 p-6 rounded-xl">
              <div className="text-4xl">?</div>
              <div className="text-sm text-center mt-2">Waiting...</div>
            </div>
          )}
        </div>
      </div>

      {/* Game Progress */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Game Progress</h4>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Andar Side */}
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600 mb-3">🟢 Andar</div>
            <div className="space-y-2">
              {drawnCards.andar.length > 0 ? (
                drawnCards.andar.map((card, index) => (
                  <div 
                    key={index}
                    className="bg-green-100 text-green-800 p-2 rounded-lg text-sm font-medium"
                  >
                    {card}
                  </div>
                ))
              ) : (
                <div className="bg-gray-100 text-gray-500 p-2 rounded-lg text-sm">
                  No cards yet
                </div>
              )}
            </div>
          </div>

          {/* Bahar Side */}
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600 mb-3">🔴 Bahar</div>
            <div className="space-y-2">
              {drawnCards.bahar.length > 0 ? (
                drawnCards.bahar.map((card, index) => (
                  <div 
                    key={index}
                    className="bg-red-100 text-red-800 p-2 rounded-lg text-sm font-medium"
                  >
                    {card}
                  </div>
                ))
              ) : (
                <div className="bg-gray-100 text-gray-500 p-2 rounded-lg text-sm">
                  No cards yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Winner Display */}
        {winner && (
          <div className="mt-6 text-center">
            <div className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${
              winner === 'andar' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              🎉 {winner === 'andar' ? 'Andar' : 'Bahar'} Wins!
            </div>
          </div>
        )}
      </div>

      {/* Stream Controls */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-center space-x-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Full Screen
          </button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default AndarBaharStream;
