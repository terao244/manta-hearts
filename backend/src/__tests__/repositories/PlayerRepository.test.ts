import {
  PlayerRepository,
  PlayerData,
} from '../../repositories/PlayerRepository';
import { PrismaService } from '../../services/PrismaService';
import { PrismaClient } from '@prisma/client';

// Prisma Player操作のモック型定義
interface MockPlayerOperations {
  findMany: jest.MockedFunction<(args?: any) => Promise<PlayerData[]>>;
  findUnique: jest.MockedFunction<(args: any) => Promise<PlayerData | null>>;
  create: jest.MockedFunction<(args: any) => Promise<PlayerData>>;
  update: jest.MockedFunction<(args: any) => Promise<PlayerData>>;
  delete: jest.MockedFunction<(args: any) => Promise<PlayerData>>;
  count: jest.MockedFunction<(args?: any) => Promise<number>>;
}

interface MockPrismaClient {
  player: MockPlayerOperations;
}

jest.mock('../../services/PrismaService');

describe('PlayerRepository', () => {
  let playerRepository: PlayerRepository;
  let mockPrismaClient: MockPrismaClient;
  let mockPrismaService: jest.Mocked<PrismaService>;

  const mockPlayer = {
    id: 1,
    name: 'North',
    displayName: '北',
    displayOrder: 1,
    isActive: true,
  };

  beforeEach(() => {
    mockPrismaClient = {
      player: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    mockPrismaService = {
      getClient: jest
        .fn()
        .mockReturnValue(mockPrismaClient as unknown as PrismaClient),
      connect: jest.fn(),
      disconnect: jest.fn(),
      healthCheck: jest.fn(),
    } as jest.Mocked<PrismaService>;

    (PrismaService.getInstance as jest.Mock).mockReturnValue(mockPrismaService);

    playerRepository = new PlayerRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all active players by default', async () => {
      mockPrismaClient.player.findMany.mockResolvedValue([mockPlayer]);

      const result = await playerRepository.findAll();

      expect(mockPrismaClient.player.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          displayName: true,
          displayOrder: true,
          isActive: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });
      expect(result).toEqual([mockPlayer]);
    });

    it('should return all players when activeOnly is false', async () => {
      mockPrismaClient.player.findMany.mockResolvedValue([mockPlayer]);

      await playerRepository.findAll(false);

      expect(mockPrismaClient.player.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          name: true,
          displayName: true,
          displayOrder: true,
          isActive: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });
    });
  });

  describe('findById', () => {
    it('should return player by id', async () => {
      mockPrismaClient.player.findUnique.mockResolvedValue(mockPlayer);

      const result = await playerRepository.findById(1);

      expect(mockPrismaClient.player.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          displayName: true,
          displayOrder: true,
          isActive: true,
        },
      });
      expect(result).toEqual(mockPlayer);
    });

    it('should return null when player not found', async () => {
      mockPrismaClient.player.findUnique.mockResolvedValue(null);

      const result = await playerRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return player by name', async () => {
      mockPrismaClient.player.findUnique.mockResolvedValue(mockPlayer);

      const result = await playerRepository.findByName('North');

      expect(mockPrismaClient.player.findUnique).toHaveBeenCalledWith({
        where: { name: 'North' },
        select: {
          id: true,
          name: true,
          displayName: true,
          displayOrder: true,
          isActive: true,
        },
      });
      expect(result).toEqual(mockPlayer);
    });
  });

  describe('create', () => {
    it('should create new player', async () => {
      const newPlayerData = {
        name: 'East',
        displayName: '東',
        displayOrder: 2,
        isActive: true,
      };
      const createdPlayer = { id: 2, ...newPlayerData };

      mockPrismaClient.player.create.mockResolvedValue(createdPlayer);

      const result = await playerRepository.create(newPlayerData);

      expect(mockPrismaClient.player.create).toHaveBeenCalledWith({
        data: newPlayerData,
        select: {
          id: true,
          name: true,
          displayName: true,
          displayOrder: true,
          isActive: true,
        },
      });
      expect(result).toEqual(createdPlayer);
    });
  });

  describe('update', () => {
    it('should update player', async () => {
      const updateData = { displayName: '更新された北' };
      const updatedPlayer = { ...mockPlayer, ...updateData };

      mockPrismaClient.player.update.mockResolvedValue(updatedPlayer);

      const result = await playerRepository.update(1, updateData);

      expect(mockPrismaClient.player.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
        select: {
          id: true,
          name: true,
          displayName: true,
          displayOrder: true,
          isActive: true,
        },
      });
      expect(result).toEqual(updatedPlayer);
    });

    it('should return null when player not found', async () => {
      const error = { code: 'P2025' };
      mockPrismaClient.player.update.mockRejectedValue(error);

      const result = await playerRepository.update(999, {
        displayName: 'Test',
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete player successfully', async () => {
      mockPrismaClient.player.delete.mockResolvedValue(mockPlayer);

      const result = await playerRepository.delete(1);

      expect(mockPrismaClient.player.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBe(true);
    });

    it('should return false when player not found', async () => {
      const error = { code: 'P2025' };
      mockPrismaClient.player.delete.mockRejectedValue(error);

      const result = await playerRepository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should count active players by default', async () => {
      mockPrismaClient.player.count.mockResolvedValue(4);

      const result = await playerRepository.count();

      expect(mockPrismaClient.player.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toBe(4);
    });

    it('should count all players when activeOnly is false', async () => {
      mockPrismaClient.player.count.mockResolvedValue(5);

      const result = await playerRepository.count(false);

      expect(mockPrismaClient.player.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(result).toBe(5);
    });
  });
});
