import React, { useState, useEffect } from 'react';

interface AndarBaharBettingProps {
  userBalance: number;
  onPlaceBet: (side: 'andar' | 'bahar', amount: number) => Promise<void>;
  isBettingOpen: boolean;
  timeLeft: number;
  odds: {
    andar: number;
    bahar: number;
  };
}

export function AndarBaharBetting({ 
  userBalance, 
  onPlaceBet, 
  isBettingOpen, 
  timeLeft, 
  odds 
}: AndarBaharBettingProps) {
  const [selectedSide, setSelectedSide] = useState<'andar' | 'bahar' | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [potentialWinnings, setPotentialWinnings] = useState(0);

  useEffect(() => {
    if (selectedSide && stakeAmount) {
      const stake = parseFloat(stakeAmount);
      if (!isNaN(stake)) {
        const winnings = stake * (selectedSide === 'andar' ? odds.andar : odds.bahar);
        setPotentialWinnings(winnings);
      }
    } else {
      setPotentialWinnings(0);
    }
  }, [selectedSide, stakeAmount, odds]);

  const handleSideSelect = (side: 'andar' | 'bahar') => {
    setSelectedSide(side);
  };

  const handleStakeChange = (value: string) => {
    const numValue = parseFloat(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setStakeAmount(value);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedSide || !stakeAmount || !isBettingOpen) return;

    const stake = parseFloat(stakeAmount);
    if (stake <= 0 || stake > userBalance) return;

    setIsPlacingBet(true);
    try {
      await onPlaceBet(selectedSide, stake);
      setStakeAmount('');
      setSelectedSide(null);
    } catch (error) {
      console.error('Error placing bet:', error);
    } finally {
      setIsPlacingBet(false);
    }
  };

  const isBetDisabled = !selectedSide || !stakeAmount || !isBettingOpen || isPlacingBet;

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Place Your Bet</h3>
      
      {/* Betting Sides */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => handleSideSelect('andar')}
          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
            selectedSide === 'andar'
              ? 'border-green-500 bg-green-50 text-green-800'
              : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
          }`}
        >
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">🟢</div>
            <div className="text-lg font-semibold">Andar</div>
            <div className="text-sm text-gray-600">Odds: {odds.andar}</div>
          </div>
        </button>

        <button
          onClick={() => handleSideSelect('bahar')}
          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
            selectedSide === 'bahar'
              ? 'border-red-500 bg-red-50 text-red-800'
              : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
          }`}
        >
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">🔴</div>
            <div className="text-lg font-semibold">Bahar</div>
            <div className="text-sm text-gray-600">Odds: {odds.bahar}</div>
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
            type="number"
            value={stakeAmount}
            onChange={(e) => handleStakeChange(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.01"
            disabled={!isBettingOpen}
          />
          <div className="absolute right-3 top-3 text-sm text-gray-500">
            Balance: {userBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Potential Winnings */}
      {potentialWinnings > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600">Potential Winnings</div>
            <div className="text-2xl font-bold text-blue-800">{potentialWinnings.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Place Bet Button */}
      <button
        onClick={handlePlaceBet}
        disabled={isBetDisabled}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 ${
          isBetDisabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500'
        }`}
      >
        {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
      </button>

      {/* Betting Status */}
      <div className="mt-4 text-center">
        <div className={`text-sm font-medium ${
          isBettingOpen ? 'text-green-600' : 'text-red-600'
        }`}>
          {isBettingOpen ? `Betting Open - ${timeLeft}s left` : 'Betting Closed'}
        </div>
      </div>
    </div>
  );
}

export default AndarBaharBetting;
