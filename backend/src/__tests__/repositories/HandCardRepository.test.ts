import { HandCardRepository } from '../../repositories/HandCardRepository';
import { PrismaService } from '../../services/PrismaService';
import { createMockPrismaService } from '../../helpers/mockHelpers';

describe('HandCardRepository', () => {
  let handCardRepository: HandCardRepository;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    jest.spyOn(PrismaService, 'getInstance').mockReturnValue(mockPrismaService as any);
    handCardRepository = new HandCardRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveHandCards', () => {
    it('should save hand cards for all players', async () => {
      const handId = 101;
      const playerCards = new Map([
        [1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]],  // 13枚
        [2, [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]],
        [3, [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39]],
        [4, [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52]]
      ]);

      const expectedData = [];
      for (const [playerId, cardIds] of playerCards) {
        for (const cardId of cardIds) {
          expectedData.push({
            handId,
            playerId,
            cardId
          });
        }
      }

      mockPrismaService.getClient().handCard.createMany.mockResolvedValue({ count: 52 });

      const result = await handCardRepository.saveHandCards(handId, playerCards);

      expect(result).toEqual({ count: 52 });
      expect(mockPrismaService.getClient().handCard.createMany).toHaveBeenCalledWith({
        data: expectedData,
        skipDuplicates: true
      });
    });

    it('should handle empty player cards', async () => {
      const handId = 102;
      const playerCards = new Map();

      mockPrismaService.getClient().handCard.createMany.mockResolvedValue({ count: 0 });

      const result = await handCardRepository.saveHandCards(handId, playerCards);

      expect(result).toEqual({ count: 0 });
      expect(mockPrismaService.getClient().handCard.createMany).toHaveBeenCalledWith({
        data: [],
        skipDuplicates: true
      });
    });

    it('should handle partial player cards', async () => {
      const handId = 103;
      const playerCards = new Map([
        [1, [1, 2, 3]],
        [2, [4, 5]]
      ]);

      const expectedData = [
        { handId, playerId: 1, cardId: 1 },
        { handId, playerId: 1, cardId: 2 },
        { handId, playerId: 1, cardId: 3 },
        { handId, playerId: 2, cardId: 4 },
        { handId, playerId: 2, cardId: 5 }
      ];

      mockPrismaService.getClient().handCard.createMany.mockResolvedValue({ count: 5 });

      const result = await handCardRepository.saveHandCards(handId, playerCards);

      expect(result).toEqual({ count: 5 });
      expect(mockPrismaService.getClient().handCard.createMany).toHaveBeenCalledWith({
        data: expectedData,
        skipDuplicates: true
      });
    });

    it('should handle database errors', async () => {
      const handId = 104;
      const playerCards = new Map([[1, [1, 2, 3]]]);
      const error = new Error('Database error');

      mockPrismaService.getClient().handCard.createMany.mockRejectedValue(error);

      await expect(handCardRepository.saveHandCards(handId, playerCards)).rejects.toThrow('Database error');
    });
  });

  describe('findByHandId', () => {
    it('should find hand cards by hand ID', async () => {
      const handId = 101;
      const mockHandCards = [
        {
          id: 1,
          handId,
          playerId: 1,
          cardId: 5,
          createdAt: new Date(),
          player: { id: 1, name: 'Player1', displayName: 'Player 1' },
          card: { id: 5, suit: 'HEARTS', rank: 'FIVE', code: '5H', pointValue: 1, sortOrder: 4 }
        },
        {
          id: 2,
          handId,
          playerId: 2,
          cardId: 15,
          createdAt: new Date(),
          player: { id: 2, name: 'Player2', displayName: 'Player 2' },
          card: { id: 15, suit: 'SPADES', rank: 'TWO', code: '2S', pointValue: 0, sortOrder: 14 }
        }
      ];

      mockPrismaService.getClient().handCard.findMany.mockResolvedValue(mockHandCards);

      const result = await handCardRepository.findByHandId(handId);

      expect(result).toEqual(mockHandCards);
      expect(mockPrismaService.getClient().handCard.findMany).toHaveBeenCalledWith({
        where: { handId },
        include: {
          player: {
            select: { id: true, name: true, displayName: true }
          },
          card: {
            select: { id: true, suit: true, rank: true, code: true, pointValue: true, sortOrder: true }
          }
        },
        orderBy: [
          { playerId: 'asc' },
          { card: { sortOrder: 'asc' } }
        ]
      });
    });

    it('should return empty array when no hand cards found', async () => {
      const handId = 999;

      mockPrismaService.getClient().handCard.findMany.mockResolvedValue([]);

      const result = await handCardRepository.findByHandId(handId);

      expect(result).toEqual([]);
      expect(mockPrismaService.getClient().handCard.findMany).toHaveBeenCalledWith({
        where: { handId: 999 },
        include: {
          player: {
            select: { id: true, name: true, displayName: true }
          },
          card: {
            select: { id: true, suit: true, rank: true, code: true, pointValue: true, sortOrder: true }
          }
        },
        orderBy: [
          { playerId: 'asc' },
          { card: { sortOrder: 'asc' } }
        ]
      });
    });

    it('should handle database errors on find', async () => {
      const handId = 101;
      const error = new Error('Find failed');

      mockPrismaService.getClient().handCard.findMany.mockRejectedValue(error);

      await expect(handCardRepository.findByHandId(handId)).rejects.toThrow('Find failed');
    });
  });

  describe('findByHandIdAndPlayerId', () => {
    it('should find hand cards by hand ID and player ID', async () => {
      const handId = 101;
      const playerId = 1;
      const mockPlayerHandCards = [
        {
          id: 1,
          handId,
          playerId,
          cardId: 5,
          createdAt: new Date(),
          card: { id: 5, suit: 'HEARTS', rank: 'FIVE', code: '5H', pointValue: 1, sortOrder: 4 }
        },
        {
          id: 13,
          handId,
          playerId,
          cardId: 18,
          createdAt: new Date(),
          card: { id: 18, suit: 'CLUBS', rank: 'FIVE', code: '5C', pointValue: 0, sortOrder: 17 }
        }
      ];

      mockPrismaService.getClient().handCard.findMany.mockResolvedValue(mockPlayerHandCards);

      const result = await handCardRepository.findByHandIdAndPlayerId(handId, playerId);

      expect(result).toEqual(mockPlayerHandCards);
      expect(mockPrismaService.getClient().handCard.findMany).toHaveBeenCalledWith({
        where: { handId, playerId },
        include: {
          card: {
            select: { id: true, suit: true, rank: true, code: true, pointValue: true, sortOrder: true }
          }
        },
        orderBy: { card: { sortOrder: 'asc' } }
      });
    });

    it('should return empty array when no cards found for player', async () => {
      const handId = 101;
      const playerId = 999;

      mockPrismaService.getClient().handCard.findMany.mockResolvedValue([]);

      const result = await handCardRepository.findByHandIdAndPlayerId(handId, playerId);

      expect(result).toEqual([]);
    });

    it('should handle database errors on findByHandIdAndPlayerId', async () => {
      const handId = 101;
      const playerId = 1;
      const error = new Error('Find by player failed');

      mockPrismaService.getClient().handCard.findMany.mockRejectedValue(error);

      await expect(handCardRepository.findByHandIdAndPlayerId(handId, playerId)).rejects.toThrow('Find by player failed');
    });
  });
});