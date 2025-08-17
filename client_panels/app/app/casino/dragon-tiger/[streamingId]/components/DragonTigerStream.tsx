'use client'

import React, { useState, useEffect } from 'react';
import { useDragonTiger } from '../context/DragonTigerContext';

interface DragonTigerStreamProps {
  isMobile: boolean;
  isTablet: boolean;
}

export default function DragonTigerStream({ isMobile, isTablet }: DragonTigerStreamProps) {
  const { state } = useDragonTiger();
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(true);

  const { 
    dragonCard, 
    tigerCard, 
    gameStatus, 
    winner, 
    timeLeft, 
    roundId 
  } = state;

  // Simulate stream loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStreamLoading(false);
      // Simulate stream error for demo purposes
      // In real implementation, check actual stream availability
      if (Math.random() < 0.1) { // 10% chance of error for demo
        setStreamError('Stream temporarily unavailable');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Get game status display
  const getGameStatusDisplay = () => {
    switch (gameStatus) {
      case 'waiting':
        return { text: 'Waiting for next round', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'betting':
        return { text: `Betting Open - ${timeLeft}s left`, color: 'text-green-600', bg: 'bg-green-100' };
      case 'playing':
        return { text: 'Cards being revealed...', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'finished':
        return { text: 'Round finished', color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { text: 'Unknown status', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Get card display
  const getCardDisplay = (card: string | null, side: 'dragon' | 'tiger') => {
    if (!card) {
      return (
        <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-1">
              {side === 'dragon' ? '🐉' : '🐯'}
            </div>
            <div className="text-sm text-gray-500 font-medium">
              {side === 'dragon' ? 'Dragon' : 'Tiger'} Card
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-32 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-300 flex items-center justify-center shadow-lg">
        <div className="text-center">
          <div className="text-3xl mb-1">🃏</div>
          <div className="text-sm text-red-700 font-bold">{card}</div>
        </div>
      </div>
    );
  };

  // Get winner highlight style
  const getWinnerStyle = (side: 'dragon' | 'tiger') => {
    if (winner === side) {
      return 'ring-4 ring-green-500 ring-opacity-75 shadow-lg transform scale-105';
    }
    return '';
  };

  // Handle stream retry
  const handleRetry = () => {
    setStreamError(null);
    setIsStreamLoading(true);
    setTimeout(() => {
      setIsStreamLoading(false);
    }, 2000);
  };

  if (streamError) {
    return (
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Stream Unavailable</h3>
          <p className="text-gray-600 mb-6">{streamError}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Stream
          </button>
        </div>
      </div>
    );
  }

  if (isStreamLoading) {
    return (
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Loading Stream</h3>
          <p className="text-gray-500">Connecting to Dragon Tiger game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
      {/* Game Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dragon Tiger Live</h2>
        <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium">
          <span className={`${getGameStatusDisplay().bg} ${getGameStatusDisplay().color} px-3 py-1 rounded-full`}>
            {getGameStatusDisplay().text}
          </span>
        </div>
        {roundId && (
          <div className="text-xs text-gray-500 mt-2">Round: {roundId}</div>
        )}
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Dragon Side */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-blue-600 mb-2">🐉 Dragon</h3>
            <div className={`transition-all duration-500 ${getWinnerStyle('dragon')}`}>
              {getCardDisplay(dragonCard, 'dragon')}
            </div>
          </div>
        </div>

        {/* Tiger Side */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-600 mb-2">🐯 Tiger</h3>
            <div className={`transition-all duration-500 ${getWinnerStyle('tiger')}`}>
              {getCardDisplay(tigerCard, 'tiger')}
            </div>
          </div>
        </div>
      </div>

      {/* Game Status Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-orange-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600 mb-1">Game Status</div>
            <div className="font-semibold text-gray-800">
              {gameStatus.charAt(0).toUpperCase() + gameStatus.slice(1)}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Time Left</div>
            <div className="font-semibold text-gray-800">
              {timeLeft > 0 ? `${timeLeft}s` : 'Closed'}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Winner</div>
            <div className="font-semibold text-gray-800">
              {winner ? (
                <span className={`px-2 py-1 rounded-full text-sm ${
                  winner === 'dragon' ? 'bg-blue-100 text-blue-800' :
                  winner === 'tiger' ? 'bg-orange-100 text-orange-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {winner.charAt(0).toUpperCase() + winner.slice(1)}
                </span>
              ) : (
                'Pending'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Announcement */}
      {winner && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg text-center">
          <div className="text-2xl mb-2">🎉</div>
          <h3 className="text-lg font-bold text-green-800 mb-1">
            {winner === 'dragon' ? '🐉 Dragon Wins!' : 
             winner === 'tiger' ? '🐯 Tiger Wins!' : 
             '🎯 It\'s a Tie!'}
          </h3>
          <p className="text-green-600">
            {winner === 'tie' 
              ? 'Both sides have equal card values'
              : `${winner.charAt(0).toUpperCase() + winner.slice(1)} has the higher card value`
            }
          </p>
        </div>
      )}

      {/* Game Instructions */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">How to Play:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Two cards are drawn: one for Dragon and one for Tiger</li>
          <li>• Higher card value wins (Ace = 1, Jack = 11, Queen = 12, King = 13)</li>
          <li>• If both cards have the same value, it's a Tie</li>
          <li>• Place your bet before the timer runs out</li>
        </ul>
      </div>

      {/* Connection Status */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live Connected
        </div>
      </div>
    </div>
  );
}
