'use client'

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HLSVideoPlayerProps {
  src: string;
  eventId: string;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

export default function HLSVideoPlayer({ 
  src, 
  eventId, 
  className = '', 
  onError, 
  onLoad 
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize HLS with the given stream URL
  const initializeHLS = (streamUrl: string) => {
    const video = videoRef.current;
    if (!video) return;
    
    // Check if HLS is supported
    if (Hls.isSupported()) {
      // Create HLS instance
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        maxFragLookUpTolerance: 0.25,
        // Use only duration-based properties (not count-based)
        liveSyncDuration: 3,
        liveMaxLatencyDuration: 10,
        liveDurationInfinity: true,
        liveBackBufferLength: 90,
        progressive: false,
        debug: false,
      });

      hlsRef.current = hls;

      // Bind HLS events
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setError(null);
        onLoad?.();
        // Auto-play if supported
        if (video.paused) {
          video.play().catch(() => {
            // Auto-play failed, user needs to click
            setIsPlaying(false);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error Details:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          url: data.url,
          response: data.response
        });
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError(`Network error: ${data.details || 'Check connection'}`);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError(`Media error: ${data.details || 'Stream unavailable'}`);
              break;
            default:
              setError(`Stream error: ${data.details || 'Unknown issue'}`);
              break;
          }
          onError?.(error || 'Stream error');
        }
      });

      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        console.log('Manifest loading from:', streamUrl);
      });

      hls.on(Hls.Events.MANIFEST_LOADED, () => {
        console.log('Manifest loaded successfully!');
      });

      // Load the source
      console.log('Loading HLS source:', streamUrl);
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      console.log('HLS attached to video element');

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        setError(null);
        onLoad?.();
      });
      video.addEventListener('error', () => {
        setError('Stream error - please try again');
        onError?.(error || 'Stream error');
      });
    } else {
      setError('HLS is not supported in this browser');
      onError?.(error || 'HLS not supported');
    }
  };

  // Use our proxy API directly as the stream source
  const streamUrl = `/api/live-tv/stream/${eventId}`;
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('Initializing HLS with proxy API:', streamUrl);
    // Initialize HLS with our proxy API
    initializeHLS(streamUrl);

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [eventId]);



  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReload = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setError(null);
    setIsLoading(true);
    // Restart the stream loading process (only this section, not whole page)
    const video = videoRef.current;
    if (video) {
      initializeHLS(streamUrl);
    }
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
        <div className="text-red-600 text-lg font-medium mb-2">Stream Error</div>
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={handleReload}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Retry Stream
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
            <div className="text-sm">Loading stream...</div>
          </div>
        </div>
      )}

      {/* Video Player */}
      <video
        ref={videoRef}
        className="w-full h-full rounded-lg"
        controls
        autoPlay
        muted
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Video element error:', e);
          console.error('Video error details:', videoRef.current?.error);
          setError('Video playback error');
          onError?.(error || 'Video error');
        }}
      >
        Your browser does not support HLS video playback.
      </video>

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayPause}
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors"
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <span className="text-sm">Event ID: {eventId}</span>
          </div>
          <div className="text-xs opacity-75">
            Live Stream
          </div>
        </div>
      </div>
    </div>
  );
}
