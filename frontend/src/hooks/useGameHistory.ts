'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GameData,
  UseGameHistoryOptions,
  UseGameHistoryResult,
} from '../types';
import { fetchGamesWithRetry } from '../lib/api/games';

/**
 * ゲーム履歴一覧を取得するカスタムフック
 */
export default function useGameHistory(
  options: UseGameHistoryOptions = {}
): UseGameHistoryResult {
  const [games, setGames] = useState<GameData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // optionsが変更された時にキーを再生成
  const optionsKey = JSON.stringify(options);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const query = {
        page: options.page || 1,
        limit: options.limit || 10,
        status: options.status as 'PLAYING' | 'FINISHED' | 'PAUSED' | 'ABANDONED' | undefined,
        playerId: options.playerId,
        sortBy: options.sortBy as 'startTime' | 'endTime' | 'duration' | undefined,
        sortOrder: options.sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await fetchGamesWithRetry(query);
      
      setGames(result.games);
      setPagination(result.pagination);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch game history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [optionsKey]);

  // 初回とオプション変更時にデータを取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    games,
    isLoading,
    error,
    pagination,
    refetch,
  };
}