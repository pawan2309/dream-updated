import React from 'react';
import { useToast, ToastContainer } from './ToastContainer';

export const ToastTest: React.FC = () => {
  const { toasts, success, error, warning, info } = useToast();

  const showTopLeftToast = () => {
    success('This toast appears at SCREEN top-left (viewport)', {
      position: 'top-left',
      duration: 5000
    });
  };

  const showTopCenterToast = () => {
    warning('This toast appears at SCREEN top-center (viewport)', {
      position: 'top-center',
      duration: 5000
    });
  };

  const showTopRightToast = () => {
    error('This toast appears at SCREEN top-right (viewport)', {
      position: 'top-right',
      duration: 5000
    });
  };

  const showMultipleToasts = () => {
    success('First toast - top-left', { position: 'top-left' });
    setTimeout(() => warning('Second toast - top-center', { position: 'top-center' }), 500);
    setTimeout(() => error('Third toast - top-right', { position: 'top-right' }), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Add some content to demonstrate scrolling */}
      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Toast Positioning Test
        </h1>
        
        <div className="text-center text-gray-600 mb-8">
          <p>Scroll down to test if toasts stay at SCREEN top (viewport)</p>
          <p>Toasts should appear at the top of your screen, not the top of the page</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <button
            onClick={showTopLeftToast}
            className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Show Top-Left Toast
          </button>
          
          <button
            onClick={showTopCenterToast}
            className="bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            Show Top-Center Toast
          </button>
          
          <button
            onClick={showTopRightToast}
            className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Show Top-Right Toast
          </button>
          
          <button
            onClick={showMultipleToasts}
            className="bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition-colors font-medium"
          >
            Show All Positions
          </button>
        </div>

        {/* Add lots of content to enable scrolling */}
        <div className="space-y-4 mt-16">
          <h2 className="text-2xl font-semibold text-gray-700">Scroll Test Content</h2>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-800">Section {i + 1}</h3>
              <p className="text-gray-600 mt-2">
                This is test content to enable scrolling. Toast notifications should remain 
                at the top of your screen (viewport) regardless of how far you scroll down.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Scroll down and click the toast buttons above to test positioning.
              </p>
            </div>
          ))}
        </div>
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
