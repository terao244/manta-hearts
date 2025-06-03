'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GameDetailData,
  UseGameDetailResult,
} from '../types';
import { fetchGameByIdWithRetry } from '../lib/api/games';

/**
 * 特定のゲーム詳細を取得するカスタムフック
 */
export function useGameDetail(gameId: number): UseGameDetailResult {
  const [game, setGame] = useState<GameDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!gameId || gameId <= 0) {
      setError(new Error('Invalid game ID'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const gameData = await fetchGameByIdWithRetry(gameId);
      setGame(gameData);
    } catch (err) {
      setError(err as Error);
      console.error(`Failed to fetch game detail for ID ${gameId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  // 初回とgameId変更時にデータを取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    game,
    isLoading,
    error,
    refetch,
  };
}