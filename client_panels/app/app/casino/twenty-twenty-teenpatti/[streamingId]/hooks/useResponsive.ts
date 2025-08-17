import { useState, useEffect } from 'react';
import { GAME_CONFIG } from '../config/gameConfig';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: string;
  screenWidth: number;
  screenHeight: number;
}

export const useResponsive = (): ResponsiveState => {
  const [responsiveState, setResponsiveState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    currentBreakpoint: 'mobile',
    screenWidth: 0,
    screenHeight: 0
  });

  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const isMobile = width < 640; // sm
      const isTablet = width >= 640 && width < 1024; // sm to lg
      const isDesktop = width >= 1024 && width < 1280; // lg to xl
      const isLargeDesktop = width >= 1280; // xl+

      let currentBreakpoint = 'mobile';
      if (isLargeDesktop) currentBreakpoint = 'xl';
      else if (isDesktop) currentBreakpoint = 'lg';
      else if (isTablet) currentBreakpoint = 'md';
      else currentBreakpoint = 'sm';

      setResponsiveState({
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        currentBreakpoint,
        screenWidth: width,
        screenHeight: height
      });
    };

    // Initial update
    updateResponsiveState();

    // Add event listener
    window.addEventListener('resize', updateResponsiveState);

    // Cleanup
    return () => window.removeEventListener('resize', updateResponsiveState);
  }, []);

  return responsiveState;
};

// Hook for conditional rendering based on screen size
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

// Predefined media queries
export const MEDIA_QUERIES = {
  MOBILE: '(max-width: 639px)',
  TABLET: '(min-width: 640px) and (max-width: 1023px)',
  DESKTOP: '(min-width: 1024px) and (max-width: 1279px)',
  LARGE_DESKTOP: '(min-width: 1280px)',
  MOBILE_AND_TABLET: '(max-width: 1023px)',
  TABLET_AND_DESKTOP: '(min-width: 640px)',
  DESKTOP_AND_UP: '(min-width: 1024px)'
} as const;

// Hook for orientation changes
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);

    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return orientation;
};

// Hook for scroll position
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      setScrollPosition(window.pageYOffset);
    };

    window.addEventListener('scroll', updatePosition);
    updatePosition();

    return () => window.removeEventListener('scroll', updatePosition);
  }, []);

  return scrollPosition;
};
