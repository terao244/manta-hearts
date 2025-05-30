import { PrismaService } from '../../services/PrismaService';
import { PrismaClient } from '@prisma/client';

// PrismaClientのモック型定義
interface MockPrismaClient {
  $connect: jest.MockedFunction<() => Promise<void>>;
  $disconnect: jest.MockedFunction<() => Promise<void>>;
  $queryRaw: jest.MockedFunction<any>;
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

describe('PrismaService', () => {
  let prismaService: PrismaService;
  let mockPrismaClient: MockPrismaClient;

  beforeEach(() => {
    // PrismaClientのモックを作成
    mockPrismaClient = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    (PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(
      () => mockPrismaClient as unknown as PrismaClient
    );

    // シングルトンインスタンスをリセット
    (PrismaService as any).instance = undefined;

    prismaService = PrismaService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = PrismaService.getInstance();
      const instance2 = PrismaService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create PrismaClient with correct configuration', () => {
      expect(PrismaClient).toHaveBeenCalledWith({
        log: ['error'],
      });
    });
  });

  describe('getClient', () => {
    it('should return PrismaClient instance', () => {
      const client = prismaService.getClient();
      expect(client).toBe(mockPrismaClient);
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      await expect(prismaService.connect()).resolves.toBeUndefined();
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });

    it('should throw error on connection failure', async () => {
      const error = new Error('Connection failed');
      mockPrismaClient.$connect.mockRejectedValue(error);

      await expect(prismaService.connect()).rejects.toThrow(
        'Connection failed'
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await expect(prismaService.disconnect()).resolves.toBeUndefined();
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should throw error on disconnection failure', async () => {
      const error = new Error('Disconnection failed');
      mockPrismaClient.$disconnect.mockRejectedValue(error);

      await expect(prismaService.disconnect()).rejects.toThrow(
        'Disconnection failed'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      mockPrismaClient.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await prismaService.healthCheck();
      expect(result).toBe(true);
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    });

    it('should return false when database is unhealthy', async () => {
      mockPrismaClient.$queryRaw.mockRejectedValue(new Error('Query failed'));

      const result = await prismaService.healthCheck();
      expect(result).toBe(false);
    });
  });
});
