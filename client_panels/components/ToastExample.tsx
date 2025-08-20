import React from 'react';
import { useToast, ToastContainer } from './ToastContainer';

export const ToastExample: React.FC = () => {
  const { toasts, success, error, warning, info, clearToasts } = useToast();

  const showSuccessToast = () => {
    success('Bet placed successfully! Your bet has been recorded.', {
      duration: 5000,
      position: 'top-center'
    });
  };

  const showErrorToast = () => {
    error('Failed to place bet. Please check your balance and try again.', {
      duration: 6000,
      position: 'top-right'
    });
  };

  const showWarningToast = () => {
    warning('Low balance warning. Consider reducing your stake amount.', {
      duration: 4000,
      position: 'top-left'
    });
  };

  const showInfoToast = () => {
    info('New odds available for your selected match!', {
      duration: 3000,
      position: 'top-center'
    });
  };

  const showMultipleToasts = () => {
    success('First toast - Success!', { position: 'top-right' });
    setTimeout(() => error('Second toast - Error!', { position: 'top-center' }), 500);
    setTimeout(() => warning('Third toast - Warning!', { position: 'top-left' }), 1000);
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Toast Notification Examples</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={showSuccessToast}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Show Success Toast
        </button>
        
        <button
          onClick={showErrorToast}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Show Error Toast
        </button>
        
        <button
          onClick={showWarningToast}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Show Warning Toast
        </button>
        
        <button
          onClick={showInfoToast}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Show Info Toast
        </button>
        
        <button
          onClick={showMultipleToasts}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Show Multiple Toasts
        </button>
        
        <button
          onClick={clearToasts}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Clear All Toasts
        </button>
      </div>

      {/* Toast Container - This should be placed at the root level of your app */}
      <ToastContainer toasts={toasts} onRemoveToast={(id) => {
        // This will be handled by the useToast hook
      }} />
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>✅ Always appears at the top of the screen (fixed positioning)</li>
          <li>✅ Maximum z-index (999999) ensures it's above everything</li>
          <li>✅ Smooth slide-in animation from top</li>
          <li>✅ Multiple positions: top-right, top-center, top-left</li>
          <li>✅ Auto-stacking when multiple toasts are shown</li>
          <li>✅ Auto-dismiss with configurable duration</li>
          <li>✅ Backdrop blur effect for better visibility</li>
          <li>✅ Responsive design with proper spacing</li>
        </ul>
      </div>
    </div>
  );
};
