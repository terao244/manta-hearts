import { HandRepository } from '../../repositories/HandRepository';
import { PrismaService } from '../../services/PrismaService';
import { createMockPrismaService } from '../../helpers/mockHelpers';

describe('HandRepository', () => {
  let handRepository: HandRepository;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    jest.spyOn(PrismaService, 'getInstance').mockReturnValue(mockPrismaService as any);
    handRepository = new HandRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createHand', () => {
    it('should create a new hand with required fields', async () => {
      const gameId = 1;
      const handNumber = 1;
      const mockHand = {
        id: 101,
        gameId,
        handNumber,
        heartsBroken: false,
        shootTheMoonPlayerId: null,
        createdAt: new Date()
      };

      mockPrismaService.getClient().hand.create.mockResolvedValue(mockHand);

      const result = await handRepository.createHand(gameId, handNumber);

      expect(result).toEqual(mockHand);
      expect(mockPrismaService.getClient().hand.create).toHaveBeenCalledWith({
        data: {
          gameId,
          handNumber,
          heartsBroken: false,
          shootTheMoonPlayerId: null
        }
      });
    });

    it('should create a hand with heartsBroken = true', async () => {
      const gameId = 2;
      const handNumber = 3;
      const heartsBroken = true;
      const mockHand = {
        id: 102,
        gameId,
        handNumber,
        heartsBroken,
        shootTheMoonPlayerId: null,
        createdAt: new Date()
      };

      mockPrismaService.getClient().hand.create.mockResolvedValue(mockHand);

      const result = await handRepository.createHand(gameId, handNumber, heartsBroken);

      expect(result).toEqual(mockHand);
      expect(mockPrismaService.getClient().hand.create).toHaveBeenCalledWith({
        data: {
          gameId,
          handNumber,
          heartsBroken,
          shootTheMoonPlayerId: null
        }
      });
    });

    it('should create a hand with shootTheMoonPlayerId', async () => {
      const gameId = 3;
      const handNumber = 2;
      const heartsBroken = false;
      const shootTheMoonPlayerId = 5;
      const mockHand = {
        id: 103,
        gameId,
        handNumber,
        heartsBroken,
        shootTheMoonPlayerId,
        createdAt: new Date()
      };

      mockPrismaService.getClient().hand.create.mockResolvedValue(mockHand);

      const result = await handRepository.createHand(gameId, handNumber, heartsBroken, shootTheMoonPlayerId);

      expect(result).toEqual(mockHand);
      expect(mockPrismaService.getClient().hand.create).toHaveBeenCalledWith({
        data: {
          gameId,
          handNumber,
          heartsBroken,
          shootTheMoonPlayerId
        }
      });
    });

    it('should handle database errors', async () => {
      const gameId = 1;
      const handNumber = 1;
      const error = new Error('Database error');

      mockPrismaService.getClient().hand.create.mockRejectedValue(error);

      await expect(handRepository.createHand(gameId, handNumber)).rejects.toThrow('Database error');
    });
  });

  describe('updateHand', () => {
    it('should update hand with heartsBroken', async () => {
      const handId = 101;
      const updates = { heartsBroken: true };
      const mockUpdatedHand = {
        id: handId,
        gameId: 1,
        handNumber: 1,
        heartsBroken: true,
        shootTheMoonPlayerId: null,
        createdAt: new Date()
      };

      mockPrismaService.getClient().hand.update.mockResolvedValue(mockUpdatedHand);

      const result = await handRepository.updateHand(handId, updates);

      expect(result).toEqual(mockUpdatedHand);
      expect(mockPrismaService.getClient().hand.update).toHaveBeenCalledWith({
        where: { id: handId },
        data: updates
      });
    });

    it('should update hand with shootTheMoonPlayerId', async () => {
      const handId = 102;
      const updates = { shootTheMoonPlayerId: 7 };
      const mockUpdatedHand = {
        id: handId,
        gameId: 2,
        handNumber: 2,
        heartsBroken: false,
        shootTheMoonPlayerId: 7,
        createdAt: new Date()
      };

      mockPrismaService.getClient().hand.update.mockResolvedValue(mockUpdatedHand);

      const result = await handRepository.updateHand(handId, updates);

      expect(result).toEqual(mockUpdatedHand);
      expect(mockPrismaService.getClient().hand.update).toHaveBeenCalledWith({
        where: { id: handId },
        data: updates
      });
    });

    it('should update hand with multiple fields', async () => {
      const handId = 103;
      const updates = { heartsBroken: true, shootTheMoonPlayerId: 9 };
      const mockUpdatedHand = {
        id: handId,
        gameId: 3,
        handNumber: 3,
        heartsBroken: true,
        shootTheMoonPlayerId: 9,
        createdAt: new Date()
      };

      mockPrismaService.getClient().hand.update.mockResolvedValue(mockUpdatedHand);

      const result = await handRepository.updateHand(handId, updates);

      expect(result).toEqual(mockUpdatedHand);
      expect(mockPrismaService.getClient().hand.update).toHaveBeenCalledWith({
        where: { id: handId },
        data: updates
      });
    });

    it('should handle database errors on update', async () => {
      const handId = 101;
      const updates = { heartsBroken: true };
      const error = new Error('Update failed');

      mockPrismaService.getClient().hand.update.mockRejectedValue(error);

      await expect(handRepository.updateHand(handId, updates)).rejects.toThrow('Update failed');
    });
  });

  describe('findByGameId', () => {
    it('should find hands by game ID', async () => {
      const gameId = 1;
      const mockHands = [
        {
          id: 101,
          gameId,
          handNumber: 1,
          heartsBroken: false,
          shootTheMoonPlayerId: null,
          createdAt: new Date()
        },
        {
          id: 102,
          gameId,
          handNumber: 2,
          heartsBroken: true,
          shootTheMoonPlayerId: 5,
          createdAt: new Date()
        }
      ];

      mockPrismaService.getClient().hand.findMany.mockResolvedValue(mockHands);

      const result = await handRepository.findByGameId(gameId);

      expect(result).toEqual(mockHands);
      expect(mockPrismaService.getClient().hand.findMany).toHaveBeenCalledWith({
        where: { gameId },
        orderBy: { handNumber: 'asc' }
      });
    });

    it('should return empty array when no hands found', async () => {
      const gameId = 999;

      mockPrismaService.client.hand.findMany.mockResolvedValue([]);

      const result = await handRepository.findByGameId(gameId);

      expect(result).toEqual([]);
      expect(mockPrismaService.getClient().hand.findMany).toHaveBeenCalledWith({
        where: { gameId: 999 },
        orderBy: { handNumber: 'asc' }
      });
    });

    it('should handle database errors on find', async () => {
      const gameId = 1;
      const error = new Error('Find failed');

      mockPrismaService.getClient().hand.findMany.mockRejectedValue(error);

      await expect(handRepository.findByGameId(gameId)).rejects.toThrow('Find failed');
    });
  });

  describe('findById', () => {
    it('should find hand by ID', async () => {
      const handId = 101;
      const mockHand = {
        id: handId,
        gameId: 1,
        handNumber: 1,
        heartsBroken: false,
        shootTheMoonPlayerId: null,
        createdAt: new Date()
      };

      mockPrismaService.getClient().hand.findUnique.mockResolvedValue(mockHand);

      const result = await handRepository.findById(handId);

      expect(result).toEqual(mockHand);
      expect(mockPrismaService.getClient().hand.findUnique).toHaveBeenCalledWith({
        where: { id: handId }
      });
    });

    it('should return null when hand not found', async () => {
      const handId = 999;

      mockPrismaService.client.hand.findUnique.mockResolvedValue(null);

      const result = await handRepository.findById(handId);

      expect(result).toBeNull();
      expect(mockPrismaService.getClient().hand.findUnique).toHaveBeenCalledWith({
        where: { id: 999 }
      });
    });

    it('should handle database errors on findById', async () => {
      const handId = 101;
      const error = new Error('Find by ID failed');

      mockPrismaService.getClient().hand.findUnique.mockRejectedValue(error);

      await expect(handRepository.findById(handId)).rejects.toThrow('Find by ID failed');
    });
  });
});