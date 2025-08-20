import React, { useState, useEffect, useCallback } from 'react';
import oddsService, { BetData } from '../lib/oddsService';
import { Toast } from './Toast';

interface BetSlipProps {
  bet: {
    matchId: string;
    marketId: string;
    selectionId: string;
    selectionName: string;
    odds: number;
    type: 'back' | 'lay';
    marketName: string;
  } | null;
  onConfirm: (stake: number) => Promise<boolean>;
  onClose: () => void;
  userBalance: number; // This will be userChips from the parent
  isLoading?: boolean;
}

export default function BetSlip({ 
  bet, 
  onConfirm, 
  onClose, 
  userBalance, // This will be userChips from the parent
  isLoading = false 
}: BetSlipProps) {
  const [stake, setStake] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  // Flag to prevent toast from showing again for the same bet
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    if (bet) {
      setStake(0);
      setError(null);
      // Reset toast shown flag when opening new bet slip
      setToastShown(false);
    }
  }, [bet]);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    // Don't show toast if it was already shown for this bet
    if (toastShown && type === 'success') {
      return;
    }

    // Hide any existing toast first
    setToast(prev => ({ ...prev, isVisible: false }));
    
    // Show new toast after a brief delay to ensure smooth transition
    setTimeout(() => {
      setToast({
        isVisible: true,
        message,
        type
      });
      
      // Mark toast as shown for success type
      if (type === 'success') {
        setToastShown(true);
      }
    }, 100);
  }, [toastShown]);

  useEffect(() => {
    if (bet) {
      // Hide any existing toast when opening bet slip
      hideToast();
    }
  }, [bet, hideToast]);

  const calculatePotentialProfit = () => {
    if (!bet || stake <= 0) return 0;
    
    if (bet.type === 'back') {
      return (bet.odds - 1) * stake;
    } else {
      return stake * (bet.odds - 1);
    }
  };

  const handleConfirm = async () => {
    if (!bet) return;
    
    if (stake <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }
    
    if (stake > userBalance) {
      setError('Insufficient chips');
      return;
    }

    setError(null);
    setIsPlacingBet(true);

    try {
      // Create bet data for the API
      const betData: BetData = {
        matchId: bet.matchId,
        marketId: bet.marketId,
        selection: bet.selectionName,
        stake: stake,
        odds: bet.odds,
        betType: bet.type
      };

      // Place bet using the service
      const result = await oddsService.placeBet(betData);
      
      if (result.success) {
        // Show success toast with bet name
        showToast(`${bet.selectionName} bet placed successfully!`, 'success');
        
        // Log the response data for debugging
        console.log('✅ Bet placed successfully:', result.data);
        
        // Wait a bit before calling onConfirm to ensure toast is visible
        setTimeout(async () => {
          const success = await onConfirm(stake);
          if (success) {
            onClose();
          }
        }, 500);
      } else {
        setError(result.message || 'Failed to place bet');
        // Show error toast
        showToast(`Failed to place bet: ${result.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      const errorMessage = 'Failed to place bet. Please try again.';
      setError(errorMessage);
      // Show error toast
      showToast(errorMessage, 'error');
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleStakeChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setStake(numValue);
    setError(null);
  };

  if (!bet) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📝</div>
        <p className="text-lg font-medium">No Selection</p>
        <p className="text-sm">Click on odds to place a bet</p>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
      
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-blue-600 text-white px-3 py-2 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Place Bet</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 space-y-3">
          {/* Selection Info */}
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs text-gray-600 mb-1">Selection</div>
            <div className="font-semibold text-gray-900 text-sm">{bet.selectionName}</div>
          </div>

          {/* Market Info */}
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs text-gray-600 mb-1">Market</div>
            <div className="font-semibold text-gray-900 text-sm">{bet.marketName}</div>
          </div>

          {/* Odds Info */}
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs text-gray-600 mb-1">Odds</div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 text-sm">{bet.odds.toFixed(2)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                bet.type === 'back' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
              }`}>
                {bet.type.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stake Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Stake Amount (Chips)
            </label>
            <input
              type="number"
              value={stake || ''}
              onChange={(e) => handleStakeChange(e.target.value)}
              placeholder="Enter stake"
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
            <div className="text-xs text-gray-500 mt-1">
              Available Chips: {userBalance.toFixed(2)}
            </div>
          </div>

          {/* Potential Profit */}
          <div className="bg-green-50 rounded-lg p-2">
            <div className="text-xs text-gray-600 mb-1">Potential Profit</div>
            <div className="font-bold text-green-700 text-base">
              {calculatePotentialProfit().toFixed(2)}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <div className="text-red-700 text-xs">{error}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || isPlacingBet || stake <= 0 || stake > userBalance}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isLoading || isPlacingBet || stake <= 0 || stake > userBalance
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPlacingBet ? 'Placing Bet...' : isLoading ? 'Processing...' : 'Confirm Bet'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
