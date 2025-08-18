'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface GameState {
  isActive: boolean;
  currentRound: number;
  timeLeft: number;
  selectedSide: string | null;
}

export default function AAAGame(): JSX.Element {
  const router = useRouter();
  const streamingId = router.query.streamingId as string;

  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    currentRound: 1,
    timeLeft: 30,
    selectedSide: null
  });

  const handleBackToCasino = () => {
    router.push('/app/casino');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Amar Akbar Anthony</h1>
          <button
            onClick={handleBackToCasino}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Back to Casino
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-xl text-gray-300 mb-4">
            Game ID: {streamingId}
          </p>
          <p className="text-lg text-gray-400">
            This game is currently under development
          </p>
        </div>
      </div>
    </div>
  );
}
