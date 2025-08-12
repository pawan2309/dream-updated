import React from 'react';

export interface TVPlayerPlaceholderProps {
  src?: string;
  height?: number | string;
  className?: string;
}

/**
 * TVPlayerPlaceholder renders a mock live TV player using an iframe with an overlay message.
 * Replace the `src` with a dynamic tv_url from API/DB when integrating real feeds.
 */
const TVPlayerPlaceholder: React.FC<TVPlayerPlaceholderProps> = ({
  src = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
  height = 500,
  className = ''
}) => {
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={`relative w-full ${className}`} style={{ height: resolvedHeight }}>
      <iframe
        title="Live TV Placeholder"
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allow="autoplay; encrypted-media"
        allowFullScreen
      />

      <div
        className="absolute inset-0 flex items-center justify-center text-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      >
        <span style={{ color: '#ffffff', fontSize: 18, fontWeight: 600 }}>
          TV Placeholder - Replace with Live Feed
        </span>
      </div>
    </div>
  );
};

export default TVPlayerPlaceholder;