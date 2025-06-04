import { GamePersistenceService, TrickPersistenceData } from '../../services/GamePersistenceService';
import { PrismaService } from '../../services/PrismaService';
import { createMockPrismaService } from '../../helpers/mockHelpers';
import { HandScoreData } from '../../repositories/interfaces/IHandScoreRepository';
import { Card } from '../../game/Card';

describe('GamePersistenceService', () => {
  let gamePersistenceService: GamePersistenceService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    jest.spyOn(PrismaService, 'getInstance').mockReturnValue(mockPrismaService as any);
    gamePersistenceService = GamePersistenceService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('persistHandStart', () => {
    it('should persist hand and hand cards in a transaction', async () => {
      const gameId = 1;
      const handNumber = 1;
      const playerCards = new Map([
        [1, [
          { id: 1, suit: 'HEARTS', rank: 'ACE', code: 'AH', pointValue: 1, sortOrder: 0 } as Card,
          { id: 2, suit: 'HEARTS', rank: 'TWO', code: '2H', pointValue: 1, sortOrder: 1 } as Card
        ]],
        [2, [
          { id: 3, suit: 'CLUBS', rank: 'ACE', code: 'AC', pointValue: 0, sortOrder: 13 } as Card,
          { id: 4, suit: 'CLUBS', rank: 'TWO', code: '2C', pointValue: 0, sortOrder: 14 } as Card
        ]]
      ]);

      const mockHand = { id: 101, gameId, handNumber, heartsBroken: false, shootTheMoonPlayerId: null };
      
      // モックトランザクションの設定
      mockPrismaService.getClient.mockReturnValue({
        $transaction: jest.fn().mockImplementation(async (callback) => {
          const mockTx = {
            hand: { create: jest.fn().mockResolvedValue(mockHand) },
            handCard: { createMany: jest.fn().mockResolvedValue({ count: 4 }) }
          };
          return await callback(mockTx);
        })
      } as any);

      const result = await gamePersistenceService.persistHandStart(gameId, handNumber, playerCards);

      expect(result).toBe(101);
    });

    it('should handle transaction failure and rollback', async () => {
      const gameId = 1;
      const handNumber = 1;
      const playerCards = new Map([
        [1, [{ id: 1, suit: 'HEARTS', rank: 'ACE', code: 'AH', pointValue: 1, sortOrder: 0 } as Card]]
      ]);

      // トランザクション失敗をモック
      mockPrismaService.getClient.mockReturnValue({
        $transaction: jest.fn().mockRejectedValue(new Error('Transaction failed'))
      } as any);

      await expect(gamePersistenceService.persistHandStart(gameId, handNumber, playerCards))
        .rejects.toThrow('Transaction failed');
    });
  });

  describe('persistCardExchanges', () => {
    it('should persist card exchanges in a transaction', async () => {
      const handId = 101;
      const exchanges = [
        { fromPlayerId: 1, toPlayerId: 2, cardId: 5, exchangeOrder: 1 },
        { fromPlayerId: 2, toPlayerId: 3, cardId: 10, exchangeOrder: 2 }
      ];

      mockPrismaService.getClient.mockReturnValue({
        $transaction: jest.fn().mockImplementation(async (callback) => {
          const mockTx = {
            cardExchange: { createMany: jest.fn().mockResolvedValue({ count: 2 }) }
          };
          return await callback(mockTx);
        })
      } as any);

      await gamePersistenceService.persistCardExchanges(handId, exchanges);

      expect(mockPrismaService.getClient).toHaveBeenCalled();
    });

    it('should skip persistence when no exchanges provided', async () => {
      const handId = 101;
      const exchanges: any[] = [];

      await gamePersistenceService.persistCardExchanges(handId, exchanges);

      // 空配列の場合は何も処理しないことを確認
      expect(mockPrismaService.getClient).not.toHaveBeenCalled();
    });
  });

  describe('persistTrick', () => {
    it('should persist trick and trick cards in a transaction', async () => {
      const trickData: TrickPersistenceData = {
        handId: 101,
        trickNumber: 1,
        winnerPlayerId: 2,
        points: 5,
        leadPlayerId: 1,
        trickCards: [
          { playerId: 1, cardId: 10, playOrder: 1 },
          { playerId: 2, cardId: 15, playOrder: 2 }
        ]
      };

      const mockTrick = { id: 201 };
      mockPrismaService.getClient.mockReturnValue({
        $transaction: jest.fn().mockImplementation(async (callback) => {
          const mockTx = {
            trick: { create: jest.fn().mockResolvedValue(mockTrick) },
            trickCard: { createMany: jest.fn().mockResolvedValue({ count: 2 }) }
          };
          return await callback(mockTx);
        })
      } as any);

      const result = await gamePersistenceService.persistTrick(trickData);

      expect(result).toBe(201);
    });
  });

  describe('persistHandCompletion', () => {
    it('should persist hand completion with scores in a transaction', async () => {
      const handId = 101;
      const handNumber = 1;
      const heartsBroken = true;
      const shootTheMoonPlayerId = 2;
      const handScores: HandScoreData[] = [
        {
          playerId: 1,
          handPoints: 5,
          cumulativePoints: 15,
          heartsTaken: 5,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false
        }
      ];

      mockPrismaService.getClient.mockReturnValue({
        $transaction: jest.fn().mockImplementation(async (callback) => {
          const mockTx = {
            hand: { update: jest.fn().mockResolvedValue({}) },
            handScore: { createMany: jest.fn().mockResolvedValue({ count: 1 }) }
          };
          return await callback(mockTx);
        })
      } as any);

      await gamePersistenceService.persistHandCompletion(
        handId, handNumber, heartsBroken, shootTheMoonPlayerId, handScores
      );

      expect(mockPrismaService.getClient).toHaveBeenCalled();
    });

    it('should handle no updates case', async () => {
      const handId = 101;
      const handNumber = 1;
      const heartsBroken = false;
      const shootTheMoonPlayerId = null;
      const handScores: HandScoreData[] = [];

      mockPrismaService.getClient.mockReturnValue({
        $transaction: jest.fn().mockImplementation(async (callback) => {
          const mockTx = {
            hand: { update: jest.fn() },
            handScore: { createMany: jest.fn() }
          };
          return await callback(mockTx);
        })
      } as any);

      await gamePersistenceService.persistHandCompletion(
        handId, handNumber, heartsBroken, shootTheMoonPlayerId, handScores
      );

      expect(mockPrismaService.getClient).toHaveBeenCalled();
    });
  });

  describe('persistGameCompletion', () => {
    it('should persist game completion', async () => {
      const gameId = 1;
      const winnerId = 2;
      const duration = 45;

      mockPrismaService.getClient.mockReturnValue({
        $transaction: jest.fn().mockImplementation(async (callback) => {
          const mockTx = {
            game: { update: jest.fn().mockResolvedValue({}) }
          };
          return await callback(mockTx);
        })
      } as any);

      await gamePersistenceService.persistGameCompletion(gameId, winnerId, duration);

      expect(mockPrismaService.getClient).toHaveBeenCalled();
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await gamePersistenceService.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const result = await gamePersistenceService.executeWithRetry(operation, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(gamePersistenceService.executeWithRetry(operation, 2, 10))
        .rejects.toThrow('Persistent failure');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('executeBatchOperations', () => {
    it('should execute batch operations with specified batch size', async () => {
      const operations = [
        jest.fn().mockResolvedValue('result1'),
        jest.fn().mockResolvedValue('result2'),
        jest.fn().mockResolvedValue('result3'),
        jest.fn().mockResolvedValue('result4'),
        jest.fn().mockResolvedValue('result5')
      ];

      const results = await gamePersistenceService.executeBatchOperations(operations, 2);

      expect(results).toEqual(['result1', 'result2', 'result3', 'result4', 'result5']);
      expect(operations[0]).toHaveBeenCalledTimes(1);
      expect(operations[4]).toHaveBeenCalledTimes(1);
    });

    it('should handle empty operations array', async () => {
      const operations: Array<() => Promise<string>> = [];

      const results = await gamePersistenceService.executeBatchOperations(operations);

      expect(results).toEqual([]);
    });
  });
});