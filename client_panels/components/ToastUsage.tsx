import React from 'react';
import { useToast, ToastContainer } from './ToastContainer';

export const ToastUsage: React.FC = () => {
  const { toasts, success, error, warning, info } = useToast();

  const showBetSuccess = () => {
    success('Bet placed successfully! Your bet has been recorded.', {
      position: 'top-left',
      duration: 5000
    });
  };

  const showBetError = () => {
    error('Failed to place bet. Please check your balance and try again.', {
      position: 'top-left',
      duration: 6000
    });
  };

  const showLowBalance = () => {
    warning('Low balance warning. Consider reducing your stake amount.', {
      position: 'top-left',
      duration: 4000
    });
  };

  const showNewOdds = () => {
    info('New odds available for your selected match!', {
      position: 'top-left',
      duration: 3000
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Toast Usage Example</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={showBetSuccess}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Bet Success
        </button>
        
        <button
          onClick={showBetError}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Bet Error
        </button>
        
        <button
          onClick={showLowBalance}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Low Balance
        </button>
        
        <button
          onClick={showNewOdds}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          New Odds
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Key Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>✅ <strong>Fixed to Screen Top:</strong> Toasts appear at the top of your screen (viewport), not page</li>
          <li>✅ <strong>Position: top-left:</strong> Default position is screen top-left</li>
          <li>✅ <strong>Scroll Independent:</strong> Toasts stay at screen top even when scrolling</li>
          <li>✅ <strong>Maximum Z-Index:</strong> Uses z-index 999999 to stay above everything</li>
          <li>✅ <strong>Auto-Stacking:</strong> Multiple toasts stack properly with spacing</li>
        </ul>
      </div>

      {/* Toast Container - This ensures toasts appear at screen top */}
      <ToastContainer 
        toasts={toasts} 
        onRemoveToast={(id) => {
          // This is handled automatically by the hook
        }} 
      />
    </div>
  );
};
