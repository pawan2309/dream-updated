import { useEffect, useRef, useState } from 'react';

// Lazy loading hook for images
export const useLazyImage = (src: string, alt: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsLoaded(false);
    img.src = src;
  }, [isInView, src]);

  return { imgRef, isLoaded, isInView };
};

// Lazy loading hook for components
export const useLazyComponent = (delay: number = 100) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return shouldRender;
};

// Lazy loading hook for heavy assets
export const useLazyAsset = (assetUrl: string, threshold: number = 0.1) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    if (!isInView) return;

    // Simulate asset loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [isInView]);

  return { elementRef, isLoaded, isInView };
};

// Preload critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Preload multiple images
export const preloadImages = async (srcs: string[]): Promise<void> => {
  try {
    await Promise.all(srcs.map(src => preloadImage(src)));
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
};
