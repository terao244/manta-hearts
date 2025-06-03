import {
  fetchGames,
  fetchGameById,
  fetchWithRetry,
  ApiError,
} from '../games';
import { GameData, GameDetailData } from '../../../types';

// Fetch APIをモック
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('games API client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('fetchGames', () => {
    it('should fetch games successfully', async () => {
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
      ];

      const mockResponse = {
        success: true,
        data: mockGames,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchGames();

      expect(result.games).toEqual(mockGames);
      expect(result.pagination).toEqual(mockResponse.pagination);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/games?',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should build query parameters correctly', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await fetchGames({
        page: 2,
        limit: 20,
        status: 'FINISHED',
        playerId: 1,
        sortBy: 'startTime',
        sortOrder: 'desc',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/games?page=2&limit=20&status=FINISHED&playerId=1&sortBy=startTime&sortOrder=desc',
        expect.any(Object)
      );
    });

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(fetchGames()).rejects.toThrow('HTTP error! status: 404');
    });

    it('should throw error when API returns success: false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      } as Response);

      await expect(fetchGames()).rejects.toThrow('Failed to fetch games');
    });
  });

  describe('fetchGameById', () => {
    it('should fetch game detail successfully', async () => {
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
        ],
        hands: [],
        scoreHistory: [],
        tricks: [],
      };

      const mockResponse = {
        success: true,
        data: mockGameDetail,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchGameById(1);

      expect(result).toEqual(mockGameDetail);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/games/1',
        expect.any(Object)
      );
    });

    it('should throw error when game not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      } as Response);

      await expect(fetchGameById(999)).rejects.toThrow('Failed to fetch game 999');
    });
  });

  describe('fetchWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await fetchWithRetry(mockFn, 3, 100);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValue('success');

      const result = await fetchWithRetry(mockFn, 3, 10);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(fetchWithRetry(mockFn, 2, 10)).rejects.toThrow('Always fails');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});