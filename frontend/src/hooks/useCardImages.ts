import { useEffect, useState } from 'react';
import { preloadCardImages } from '@/utils/cardImages';

interface UseCardImagesResult {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
}

/**
 * カード画像のプリロードフック
 */
export const useCardImages = (): UseCardImagesResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadImages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await preloadCardImages();
        
        if (isMounted) {
          setIsLoaded(true);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('画像の読み込みに失敗しました'));
          setIsLoading(false);
        }
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isLoading, isLoaded, error };
};