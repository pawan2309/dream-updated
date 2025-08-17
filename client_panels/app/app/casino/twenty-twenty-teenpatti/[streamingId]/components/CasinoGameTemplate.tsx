import React, { ReactNode } from 'react';
import { GAME_CONFIG, GAME_MESSAGES } from '../config/gameConfig';

// Base interface for casino game props
export interface BaseCasinoGameProps {
  streamingId: string;
  gameName: string;
  gameType: string;
  children?: ReactNode;
  className?: string;
}

// Base interface for casino game state
export interface BaseCasinoGameState {
  loading: boolean;
  error: string | null;
  isActive: boolean;
}

// Base interface for casino game actions
export interface BaseCasinoGameActions {
  refresh: () => void;
  reset: () => void;
}

// Template component for casino games
export function CasinoGameTemplate<T extends BaseCasinoGameProps>({
  streamingId,
  gameName,
  gameType,
  children,
  className = '',
  ...props
}: T & { children?: ReactNode; className?: string }) {
  return (
    <div className={`casino-game-template ${className}`} data-game-type={gameType}>
      <div className="game-header">
        <h1 className="game-title">{gameName}</h1>
        <div className="game-id">ID: {streamingId}</div>
      </div>
      
      <div className="game-content">
        {children}
      </div>
      
      <div className="game-footer">
        <div className="game-status">
          <span className="status-indicator active"></span>
          <span className="status-text">Active</span>
        </div>
      </div>
    </div>
  );
}

// Higher-order component for casino games
export function withCasinoGameTemplate<P extends BaseCasinoGameProps>(
  WrappedComponent: React.ComponentType<P>,
  defaultProps: Partial<P>
) {
  return function CasinoGameWrapper(props: P) {
    const mergedProps = { ...defaultProps, ...props };
    
    return (
      <CasinoGameTemplate {...mergedProps}>
        <WrappedComponent {...mergedProps} />
      </CasinoGameTemplate>
    );
  };
}

// Utility hook for common casino game functionality
export function useCasinoGameBase(streamingId: string) {
  const [baseState, setBaseState] = React.useState<BaseCasinoGameState>({
    loading: false,
    error: null,
    isActive: true
  });

  const baseActions: BaseCasinoGameActions = {
    refresh: () => {
      setBaseState(prev => ({ ...prev, loading: true, error: null }));
      // Simulate refresh
      setTimeout(() => {
        setBaseState(prev => ({ ...prev, loading: false }));
      }, 1000);
    },
    reset: () => {
      setBaseState({
        loading: false,
        error: null,
        isActive: true
      });
    }
  };

  return { baseState, baseActions };
}

// Common casino game components
export const CasinoGameComponents = {
  // Loading spinner
  LoadingSpinner: ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    };

    return (
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
    );
  },

  // Error message
  ErrorMessage: ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-800">{message}</p>
        </div>
        {onRetry && (
          <div className="ml-auto pl-3">
            <button
              onClick={onRetry}
              className="text-sm font-medium text-red-800 hover:text-red-600"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  ),

  // Success message
  SuccessMessage: ({ message }: { message: string }) => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-800">{message}</p>
        </div>
      </div>
    </div>
  ),

  // Info message
  InfoMessage: ({ message }: { message: string }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-800">{message}</p>
        </div>
      </div>
    </div>
  )
};

export default CasinoGameTemplate;
