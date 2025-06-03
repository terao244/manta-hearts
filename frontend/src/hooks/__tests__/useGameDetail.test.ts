import { renderHook, waitFor, act } from '@testing-library/react';
import { useGameDetail } from '../useGameDetail';
import { fetchGameByIdWithRetry } from '../../lib/api/games';
import { GameDetailData } from '../../types';

// APIクライアントをモック
jest.mock('../../lib/api/games');

const mockFetchGameByIdWithRetry = fetchGameByIdWithRetry as jest.MockedFunction<typeof fetchGameByIdWithRetry>;

describe('useGameDetail', () => {
  const mockGameDetail: GameDetailData = {
    id: 1,
    startTime: '2025-06-03T10:00:00Z',
    endTime: '2025-06-03T11:30:00Z',
    duration: 90,
    status: 'FINISHED',
    finalScores: { 1: 45, 2: 67, 3: 23, 4: 89 },
    winnerId: 3,
    players: [
      { id: 1, name: 'Player 1', position: 'North', finalScore: 45 },
      { id: 2, name: 'Player 2', position: 'East', finalScore: 67 },
      { id: 3, name: 'Player 3', position: 'South', finalScore: 23 },
      { id: 4, name: 'Player 4', position: 'West', finalScore: 89 },
    ],
    hands: [],
    scoreHistory: [
      { hand: 1, scores: { 1: 15, 2: 20, 3: 8, 4: 25 } },
      { hand: 2, scores: { 1: 30, 2: 47, 3: 15, 4: 64 } },
    ],
    tricks: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch game detail successfully', async () => {
    mockFetchGameByIdWithRetry.mockResolvedValue(mockGameDetail);

    const { result } = renderHook(() => useGameDetail(1));

    // 初期状態はロード中
    expect(result.current.isLoading).toBe(true);
    expect(result.current.game).toBeNull();
    expect(result.current.error).toBeNull();

    // データが取得されるまで待機
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.game).toEqual(mockGameDetail);
    expect(result.current.error).toBeNull();
    expect(mockFetchGameByIdWithRetry).toHaveBeenCalledWith(1);
  });

  it('should handle API errors', async () => {
    const mockError = new Error('Game not found');
    mockFetchGameByIdWithRetry.mockRejectedValue(mockError);

    const { result } = renderHook(() => useGameDetail(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.game).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('should handle invalid game ID', async () => {
    const { result } = renderHook(() => useGameDetail(0));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.game).toBeNull();
    expect(result.current.error).toEqual(new Error('Invalid game ID'));
    expect(mockFetchGameByIdWithRetry).not.toHaveBeenCalled();
  });

  it('should handle negative game ID', async () => {
    const { result } = renderHook(() => useGameDetail(-1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.game).toBeNull();
    expect(result.current.error).toEqual(new Error('Invalid game ID'));
    expect(mockFetchGameByIdWithRetry).not.toHaveBeenCalled();
  });

  it('should refetch data when refetch is called', async () => {
    mockFetchGameByIdWithRetry.mockResolvedValue(mockGameDetail);

    const { result } = renderHook(() => useGameDetail(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // refetchを呼び出し
    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchGameByIdWithRetry).toHaveBeenCalledTimes(2);
    expect(mockFetchGameByIdWithRetry).toHaveBeenCalledWith(1);
  });

  it('should refetch when gameId changes', async () => {
    mockFetchGameByIdWithRetry.mockResolvedValue(mockGameDetail);

    const { result, rerender } = renderHook(
      (gameId) => useGameDetail(gameId),
      { initialProps: 1 }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchGameByIdWithRetry).toHaveBeenCalledTimes(1);
    expect(mockFetchGameByIdWithRetry).toHaveBeenCalledWith(1);

    // gameIdを変更
    rerender(2);

    await waitFor(() => {
      expect(mockFetchGameByIdWithRetry).toHaveBeenCalledTimes(2);
    });

    expect(mockFetchGameByIdWithRetry).toHaveBeenLastCalledWith(2);
  });

  it('should not fetch when gameId remains the same', async () => {
    mockFetchGameByIdWithRetry.mockResolvedValue(mockGameDetail);

    const { result, rerender } = renderHook(
      (gameId) => useGameDetail(gameId),
      { initialProps: 1 }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchGameByIdWithRetry).toHaveBeenCalledTimes(1);

    // 同じgameIdでrerender
    rerender(1);

    // 追加のAPIコールは発生しない
    expect(mockFetchGameByIdWithRetry).toHaveBeenCalledTimes(1);
  });
});