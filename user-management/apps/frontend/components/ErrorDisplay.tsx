import React from 'react';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  const wittyMessages = [
    "Oops! Something went sideways 🎯",
    "The server is having a coffee break ☕",
    "Looks like the odds are against us this time 🎲",
    "The ball didn't bounce our way ⚽",
    "Even the best players miss sometimes 🏏",
    "The server is playing hide and seek 🔍",
    "Something's not quite right in the game 🎮",
    "The connection took a wrong turn 🛣️",
    "The server is doing some maintenance magic 🪄",
    "Looks like we hit a technical foul ⚠️"
  ];

  const randomMessage = wittyMessages[Math.floor(Math.random() * wittyMessages.length)];
  const displayMessage = message || randomMessage;

  return (
    <div className="error-display">
      <div className="error-icon">
        <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
      </div>
      <div className="error-message">
        <h3 style={{ color: '#dc3545', marginBottom: '10px' }}>Something went wrong</h3>
        <p style={{ color: '#6c757d', fontSize: '16px', marginBottom: '20px' }}>
          {displayMessage}
        </p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="btn btn-primary"
            style={{
              backgroundColor: '#0077B6',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <i className="fas fa-redo" style={{ marginRight: '8px' }}></i>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
