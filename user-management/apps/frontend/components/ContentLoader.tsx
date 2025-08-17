import React from 'react';

interface ContentLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const ContentLoader: React.FC<ContentLoaderProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const sizeMap = {
    small: { spinner: '16px', text: '14px' },
    medium: { spinner: '24px', text: '16px' },
    large: { spinner: '32px', text: '18px' }
  };

  const { spinner, text } = sizeMap[size];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      padding: '40px 20px',
      backgroundColor: '#F8F9FA',
      borderRadius: '8px',
      margin: '20px',
    }}>
      <div className="spinner-border text-primary" 
        role="status" 
        style={{ 
          width: spinner, 
          height: spinner, 
          marginBottom: '20px' 
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <div style={{ 
        fontSize: text, 
        color: '#666', 
        textAlign: 'center',
        fontWeight: '500'
      }}>
        {message}
      </div>
    </div>
  );
};

export default ContentLoader;
