import { renderHook, waitFor, act } from '@testing-library/react';
import useGameHistory from '../useGameHistory';
import { fetchGamesWithRetry } from '../../lib/api/games';
import { GameData } from '../../types';

// APIクライアントをモック
jest.mock('../../lib/api/games');

const mockFetchGamesWithRetry = fetchGamesWithRetry as jest.MockedFunction<typeof fetchGamesWithRetry>;

describe('useGameHistory', () => {
  const mockGames: GameData[] = [
    {
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
    },
    {
      id: 2,
      startTime: '2025-06-03T12:00:00Z',
      status: 'PLAYING',
      finalScores: {},
      players: [
        { id: 1, name: 'Player 1', position: 'North', finalScore: 0 },
        { id: 2, name: 'Player 2', position: 'East', finalScore: 0 },
      ],
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch games successfully', async () => {
    mockFetchGamesWithRetry.mockResolvedValue({
      games: mockGames,
      pagination: mockPagination,
    });

    const { result } = renderHook(() => useGameHistory());

    // 初期状態はロード中
    expect(result.current.isLoading).toBe(true);
    expect(result.current.games).toEqual([]);
    expect(result.current.error).toBeNull();

    // データが取得されるまで待機
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.games).toEqual(mockGames);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();
    expect(mockFetchGamesWithRetry).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: undefined,
      playerId: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  });

  it('should pass options to API correctly', async () => {
    mockFetchGamesWithRetry.mockResolvedValue({
      games: [],
      pagination: mockPagination,
    });

    const options = {
      page: 2,
      limit: 20,
      status: 'FINISHED',
      playerId: 1,
      sortBy: 'startTime',
      sortOrder: 'desc',
    };

    renderHook(() => useGameHistory(options));

    await waitFor(() => {
      expect(mockFetchGamesWithRetry).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        status: 'FINISHED',
        playerId: 1,
        sortBy: 'startTime',
        sortOrder: 'desc',
      });
    });
  });

  it('should handle API errors', async () => {
    const mockError = new Error('API Error');
    mockFetchGamesWithRetry.mockRejectedValue(mockError);

    const { result } = renderHook(() => useGameHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.games).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should refetch data when refetch is called', async () => {
    mockFetchGamesWithRetry.mockResolvedValue({
      games: mockGames,
      pagination: mockPagination,
    });

    const { result } = renderHook(() => useGameHistory());

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

    expect(mockFetchGamesWithRetry).toHaveBeenCalledTimes(2);
  });

  it('should refetch when options change', async () => {
    mockFetchGamesWithRetry.mockResolvedValue({
      games: mockGames,
      pagination: mockPagination,
    });

    const { result, rerender } = renderHook(
      (props) => useGameHistory(props),
      { initialProps: { page: 1 } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchGamesWithRetry).toHaveBeenCalledTimes(1);

    // オプションを変更
    rerender({ page: 2 });

    await waitFor(() => {
      expect(mockFetchGamesWithRetry).toHaveBeenCalledTimes(2);
    });

    expect(mockFetchGamesWithRetry).toHaveBeenLastCalledWith({
      page: 2,
      limit: 10,
      status: undefined,
      playerId: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  });
});