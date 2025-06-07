import {
  GameRepository,
  GameData,
  GameDetailData,
} from '../../repositories/GameRepository';
import { PrismaService } from '../../services/PrismaService';
import { PrismaClient, GameStatus, PlayerPosition } from '@prisma/client';

// Prisma Game操作のモック型定義
interface MockGameOperations {
  findMany: jest.MockedFunction<(args?: any) => Promise<any[]>>;
  findUnique: jest.MockedFunction<(args: any) => Promise<any | null>>;
  create: jest.MockedFunction<(args: any) => Promise<any>>;
  update: jest.MockedFunction<(args: any) => Promise<any>>;
  count: jest.MockedFunction<(args?: any) => Promise<number>>;
}

interface MockPrismaClient {
  game: MockGameOperations;
}

jest.mock('../../services/PrismaService');

describe('GameRepository', () => {
  let gameRepository: GameRepository;
  let mockPrismaClient: MockPrismaClient;
  let mockPrismaService: {
    getClient: jest.MockedFunction<() => PrismaClient>;
    connect: jest.MockedFunction<() => Promise<void>>;
    disconnect: jest.MockedFunction<() => Promise<void>>;
    healthCheck: jest.MockedFunction<() => Promise<boolean>>;
  };

  const mockGameWithPositions = {
    id: 1,
    startTime: new Date('2025-06-07T10:00:00Z'),
    endTime: new Date('2025-06-07T11:30:00Z'),
    status: 'FINISHED' as GameStatus,
    winnerId: 1,
    duration: 90,
    winner: {
      id: 1,
      name: 'North',
      displayName: '北',
    },
    sessions: [
      {
        playerId: 1,
        playerPosition: 'NORTH' as PlayerPosition,
        player: {
          id: 1,
          name: 'North',
          displayName: '北',
        },
      },
      {
        playerId: 2,
        playerPosition: 'EAST' as PlayerPosition,
        player: {
          id: 2,
          name: 'East',
          displayName: '東',
        },
      },
      {
        playerId: 3,
        playerPosition: 'SOUTH' as PlayerPosition,
        player: {
          id: 3,
          name: 'South',
          displayName: '南',
        },
      },
      {
        playerId: 4,
        playerPosition: 'WEST' as PlayerPosition,
        player: {
          id: 4,
          name: 'West',
          displayName: '西',
        },
      },
    ],
    hands: [
      {
        scores: [
          {
            playerId: 1,
            player: { id: 1, name: 'North', displayName: '北' },
            cumulativePoints: 15,
          },
          {
            playerId: 2,
            player: { id: 2, name: 'East', displayName: '東' },
            cumulativePoints: 20,
          },
          {
            playerId: 3,
            player: { id: 3, name: 'South', displayName: '南' },
            cumulativePoints: 25,
          },
          {
            playerId: 4,
            player: { id: 4, name: 'West', displayName: '西' },
            cumulativePoints: 30,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    mockPrismaClient = {
      game: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    mockPrismaService = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient as any),
      connect: jest.fn(),
      disconnect: jest.fn(),
      healthCheck: jest.fn(),
    };

    (PrismaService.getInstance as jest.Mock).mockReturnValue(mockPrismaService);

    gameRepository = new GameRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return games with player positions', async () => {
      mockPrismaClient.game.count.mockResolvedValue(1);
      mockPrismaClient.game.findMany.mockResolvedValue([mockGameWithPositions]);

      const result = await gameRepository.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.games).toHaveLength(1);
      
      const game = result.games[0];
      expect(game.players).toHaveLength(4);
      expect(game.players[0].position).toBe('North');
      expect(game.players[1].position).toBe('East');
      expect(game.players[2].position).toBe('South');
      expect(game.players[3].position).toBe('West');
    });

    it('should handle games without position data gracefully', async () => {
      const gameWithoutPositions = {
        ...mockGameWithPositions,
        sessions: mockGameWithPositions.sessions.map(session => ({
          ...session,
          playerPosition: null, // 席順データなし
        })),
      };

      mockPrismaClient.game.count.mockResolvedValue(1);
      mockPrismaClient.game.findMany.mockResolvedValue([gameWithoutPositions]);

      const result = await gameRepository.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.games).toHaveLength(1);
      
      const game = result.games[0];
      expect(game.players).toHaveLength(4);
      // 席順データがない場合はデフォルトの'North'が設定される
      expect(game.players[0].position).toBe('North');
    });
  });

  describe('findById', () => {
    const mockGameDetailWithPositions = {
      ...mockGameWithPositions,
      hands: [
        {
          id: 1,
          handNumber: 1,
          heartsBroken: false,
          shootTheMoonPlayerId: null,
          shootTheMoonPlayer: null,
          scores: mockGameWithPositions.hands[0].scores,
          tricks: [],
        },
      ],
    };

    it('should return game detail with player positions', async () => {
      mockPrismaClient.game.findUnique.mockResolvedValue(mockGameDetailWithPositions);

      const result = await gameRepository.findById(1);

      expect(result).not.toBeNull();
      expect(result!.players).toHaveLength(4);
      expect(result!.players[0].position).toBe('North');
      expect(result!.players[1].position).toBe('East');
      expect(result!.players[2].position).toBe('South');
      expect(result!.players[3].position).toBe('West');
    });

    it('should return null when game is not found', async () => {
      mockPrismaClient.game.findUnique.mockResolvedValue(null);

      const result = await gameRepository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle games without position data gracefully', async () => {
      const gameDetailWithoutPositions = {
        ...mockGameDetailWithPositions,
        sessions: mockGameDetailWithPositions.sessions.map(session => ({
          ...session,
          playerPosition: null,
        })),
      };

      mockPrismaClient.game.findUnique.mockResolvedValue(gameDetailWithoutPositions);

      const result = await gameRepository.findById(1);

      expect(result).not.toBeNull();
      expect(result!.players).toHaveLength(4);
      // 席順データがない場合はデフォルトの'North'が設定される
      expect(result!.players[0].position).toBe('North');
    });
  });

  describe('error handling', () => {
    it('should handle database errors in findAll', async () => {
      mockPrismaClient.game.count.mockRejectedValue(new Error('Database error'));

      await expect(gameRepository.findAll()).rejects.toThrow('Database error');
    });

    it('should handle database errors in findById', async () => {
      mockPrismaClient.game.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(gameRepository.findById(1)).rejects.toThrow('Database error');
    });
  });
});