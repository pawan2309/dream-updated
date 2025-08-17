import React from 'react';

interface ErrorFallbackProps {
  message: string;
  onRetry?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
}

export function ErrorFallback({ 
  message, 
  onRetry, 
  showBackButton = false, 
  onBack, 
  title = 'Stream Not Available' 
}: ErrorFallbackProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-red-50 via-red-100 to-red-200 relative">
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg">
            <div className="w-20 h-20 mx-auto mb-4">
              <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-3">{title}</h2>
            <p className="text-red-600 text-base mb-4">{message}</p>
            <div className="flex gap-3 justify-center">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold rounded-lg hover:from-blue-300 hover:to-blue-500 transition-all duration-300"
                >
                  Retry
                </button>
              )}
              {showBackButton && onBack && (
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-gradient-to-r from-red-400 to-red-600 text-white font-bold rounded-lg hover:from-red-300 hover:to-red-500 transition-all duration-300"
                >
                  Back to Casino
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
