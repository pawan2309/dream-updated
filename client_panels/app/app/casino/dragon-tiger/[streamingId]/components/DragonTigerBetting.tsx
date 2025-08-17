'use client'

import React, { useState, useMemo } from 'react';
import { useDragonTiger } from '../context/DragonTigerContext';

interface DragonTigerBettingProps {
  isMobile: boolean;
  isTablet: boolean;
}

export default function DragonTigerBetting({ isMobile, isTablet }: DragonTigerBettingProps) {
  const { state, placeBet } = useDragonTiger();
  const [stake, setStake] = useState<string>('');
  const [selectedSide, setSelectedSide] = useState<'dragon' | 'tiger' | 'tie' | null>(null);

  const { odds, userBalance, isBettingOpen, loading, userBet } = state;

  // Calculate potential winnings
  const potentialWin = useMemo(() => {
    if (!stake || !selectedSide) return 0;
    const stakeAmount = parseFloat(stake);
    return isNaN(stakeAmount) ? 0 : stakeAmount * odds[selectedSide];
  }, [stake, selectedSide, odds]);

  // Handle stake input
  const handleStakeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setStake(numericValue);
  };

  // Handle side selection
  const handleSideSelect = (side: 'dragon' | 'tiger' | 'tie') => {
    setSelectedSide(side);
  };

  // Handle bet placement
  const handlePlaceBet = async () => {
    if (!selectedSide || !stake) return;
    
    const stakeAmount = parseFloat(stake);
    if (isNaN(stakeAmount) || stakeAmount <= 0) return;
    
    if (stakeAmount > userBalance) {
      alert('Insufficient balance');
      return;
    }

    await placeBet(selectedSide, stakeAmount);
    
    // Reset form after successful bet
    setStake('');
    setSelectedSide(null);
  };

  // Quick stake buttons
  const quickStakes = [100, 500, 1000, 5000, 10000];

  const handleQuickStake = (amount: number) => {
    setStake(amount.toString());
  };

  // Get side button styles
  const getSideButtonStyle = (side: 'dragon' | 'tiger' | 'tie') => {
    const baseStyle = "flex-1 py-3 px-4 rounded-lg font-semibold text-center transition-all duration-200 border-2";
    
    if (selectedSide === side) {
      return `${baseStyle} bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105`;
    }
    
    return `${baseStyle} bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-md`;
  };

  // Get odds display style
  const getOddsStyle = (side: 'dragon' | 'tiger' | 'tie') => {
    const baseStyle = "text-sm font-medium px-2 py-1 rounded";
    
    if (side === 'tie') {
      return `${baseStyle} bg-purple-100 text-purple-800`;
    }
    
    return `${baseStyle} bg-gray-100 text-gray-800`;
  };

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Place Your Bet</h3>
        <p className="text-gray-600 text-sm">
          {isBettingOpen 
            ? 'Betting is now open. Choose your side and place your bet!'
            : 'Betting is closed for this round.'
          }
        </p>
      </div>

      {/* Betting Options */}
      <div className="space-y-4 mb-6">
        {/* Dragon vs Tiger */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSideSelect('dragon')}
            disabled={!isBettingOpen || loading}
            className={getSideButtonStyle('dragon')}
          >
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">🐉 Dragon</span>
              <span className={getOddsStyle('dragon')}>
                {odds.dragon}x
              </span>
            </div>
          </button>
          
          <button
            onClick={() => handleSideSelect('tiger')}
            disabled={!isBettingOpen || loading}
            className={getSideButtonStyle('tiger')}
          >
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">🐯 Tiger</span>
              <span className={getOddsStyle('tiger')}>
                {odds.tiger}x
              </span>
            </div>
          </button>
        </div>

        {/* Tie Option */}
        <button
          onClick={() => handleSideSelect('tie')}
          disabled={!isBettingOpen || loading}
          className={`w-full ${getSideButtonStyle('tie')}`}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold">🎯 Tie</span>
            <span className={getOddsStyle('tie')}>
              {odds.tie}x
            </span>
          </div>
        </button>
      </div>

      {/* Stake Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stake Amount
        </label>
        <div className="relative">
          <input
            type="text"
            value={stake}
            onChange={(e) => handleStakeChange(e.target.value)}
            placeholder="Enter stake amount"
            disabled={!isBettingOpen || loading || !selectedSide}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            
          </div>
        </div>
        
        {/* Quick Stake Buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickStakes.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickStake(amount)}
              disabled={!isBettingOpen || loading || !selectedSide}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Potential Winnings */}
      {selectedSide && stake && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800">Potential Win:</span>
            <span className="text-lg font-bold text-blue-900">
              {potentialWin.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Stake: {parseFloat(stake).toLocaleString()} × {odds[selectedSide]}x
          </div>
        </div>
      )}

      {/* User Balance */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Your Balance:</span>
          <span className="text-lg font-bold text-gray-900">
            {userBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Place Bet Button */}
      <button
        onClick={handlePlaceBet}
        disabled={!isBettingOpen || loading || !selectedSide || !stake}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Placing Bet...
          </div>
        ) : (
          `Place Bet on ${selectedSide ? selectedSide.charAt(0).toUpperCase() + selectedSide.slice(1) : 'Side'}`
        )}
      </button>

      {/* Current Bet Display */}
      {userBet.side && userBet.amount > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-green-600 mb-1">Current Bet</div>
            <div className="text-lg font-bold text-green-800">
              {userBet.amount.toLocaleString()} on {userBet.side.charAt(0).toUpperCase() + userBet.side.slice(1)}
            </div>
            <div className="text-sm text-green-600">
              Potential Win: {userBet.potentialWin.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Game Status */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
          {isBettingOpen ? (
            <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full">
              🟢 Betting Open
            </span>
          ) : (
            <span className="text-red-600 bg-red-100 px-3 py-1 rounded-full">
              🔴 Betting Closed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
