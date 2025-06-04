import { HandScoreRepository } from '../../repositories/HandScoreRepository';
import { PrismaService } from '../../services/PrismaService';
import { createMockPrismaService } from '../../helpers/mockHelpers';
import { HandScoreData } from '../../repositories/interfaces/IHandScoreRepository';

describe('HandScoreRepository', () => {
  let handScoreRepository: HandScoreRepository;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    jest.spyOn(PrismaService, 'getInstance').mockReturnValue(mockPrismaService as any);
    handScoreRepository = new HandScoreRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveHandScores', () => {
    it('should save hand scores for all 4 players', async () => {
      const handId = 101;
      const handScores: HandScoreData[] = [
        {
          playerId: 1,
          handPoints: 5,
          cumulativePoints: 15,
          heartsTaken: 5,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false
        },
        {
          playerId: 2,
          handPoints: 0,
          cumulativePoints: 0,
          heartsTaken: 0,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false
        },
        {
          playerId: 3,
          handPoints: 13,
          cumulativePoints: 33,
          heartsTaken: 0,
          queenOfSpadesTaken: true,
          shootTheMoonAchieved: false
        },
        {
          playerId: 4,
          handPoints: 8,
          cumulativePoints: 22,
          heartsTaken: 8,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false
        }
      ];

      const mockSavedScores = handScores.map((score, index) => ({
        id: 201 + index,
        handId,
        ...score,
        createdAt: new Date()
      }));

      mockPrismaService.getClient().handScore.createMany.mockResolvedValue({ count: 4 });
      mockPrismaService.getClient().handScore.findMany.mockResolvedValue(mockSavedScores);

      const result = await handScoreRepository.saveHandScores(handId, handScores);

      expect(result).toEqual(mockSavedScores);
      expect(mockPrismaService.getClient().handScore.createMany).toHaveBeenCalledWith({
        data: handScores.map(score => ({
          handId,
          ...score
        }))
      });
      expect(mockPrismaService.getClient().handScore.findMany).toHaveBeenCalledWith({
        where: { handId },
        orderBy: { playerId: 'asc' }
      });
    });

    it('should save hand scores with shoot the moon achievement', async () => {
      const handId = 102;
      const handScores: HandScoreData[] = [
        {
          playerId: 1,
          handPoints: 0,
          cumulativePoints: 10,
          heartsTaken: 13,
          queenOfSpadesTaken: true,
          shootTheMoonAchieved: true
        },
        {
          playerId: 2,
          handPoints: 26,
          cumulativePoints: 46,
          heartsTaken: 0,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false
        },
        {
          playerId: 3,
          handPoints: 26,
          cumulativePoints: 66,
          heartsTaken: 0,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false
        },
        {
          playerId: 4,
          handPoints: 26,
          cumulativePoints: 56,
          heartsTaken: 0,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false
        }
      ];

      const mockSavedScores = handScores.map((score, index) => ({
        id: 301 + index,
        handId,
        ...score,
        createdAt: new Date()
      }));

      mockPrismaService.getClient().handScore.createMany.mockResolvedValue({ count: 4 });
      mockPrismaService.getClient().handScore.findMany.mockResolvedValue(mockSavedScores);

      const result = await handScoreRepository.saveHandScores(handId, handScores);

      expect(result).toEqual(mockSavedScores);
      expect(mockPrismaService.getClient().handScore.createMany).toHaveBeenCalledWith({
        data: handScores.map(score => ({
          handId,
          ...score
        }))
      });
    });

    it('should handle database errors during save', async () => {
      const handId = 101;
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
      const error = new Error('Database save error');

      mockPrismaService.getClient().handScore.createMany.mockRejectedValue(error);

      await expect(handScoreRepository.saveHandScores(handId, handScores)).rejects.toThrow('Database save error');
    });
  });

  describe('findByHandId', () => {
    it('should find all hand scores by hand ID', async () => {
      const handId = 101;
      const mockHandScores = [
        {
          id: 201,
          handId,
          playerId: 1,
          handPoints: 5,
          cumulativePoints: 15,
          heartsTaken: 5,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false,
          createdAt: new Date()
        },
        {
          id: 202,
          handId,
          playerId: 2,
          handPoints: 0,
          cumulativePoints: 0,
          heartsTaken: 0,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false,
          createdAt: new Date()
        }
      ];

      mockPrismaService.getClient().handScore.findMany.mockResolvedValue(mockHandScores);

      const result = await handScoreRepository.findByHandId(handId);

      expect(result).toEqual(mockHandScores);
      expect(mockPrismaService.getClient().handScore.findMany).toHaveBeenCalledWith({
        where: { handId },
        orderBy: { playerId: 'asc' }
      });
    });

    it('should return empty array when no scores found', async () => {
      const handId = 999;

      mockPrismaService.getClient().handScore.findMany.mockResolvedValue([]);

      const result = await handScoreRepository.findByHandId(handId);

      expect(result).toEqual([]);
    });

    it('should handle database errors during find', async () => {
      const handId = 101;
      const error = new Error('Database find error');

      mockPrismaService.getClient().handScore.findMany.mockRejectedValue(error);

      await expect(handScoreRepository.findByHandId(handId)).rejects.toThrow('Database find error');
    });
  });

  describe('findByPlayerId', () => {
    it('should find all hand scores by player ID', async () => {
      const playerId = 1;
      const mockHandScores = [
        {
          id: 201,
          handId: 101,
          playerId,
          handPoints: 5,
          cumulativePoints: 15,
          heartsTaken: 5,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false,
          createdAt: new Date()
        },
        {
          id: 301,
          handId: 102,
          playerId,
          handPoints: 8,
          cumulativePoints: 23,
          heartsTaken: 8,
          queenOfSpadesTaken: false,
          shootTheMoonAchieved: false,
          createdAt: new Date()
        }
      ];

      mockPrismaService.getClient().handScore.findMany.mockResolvedValue(mockHandScores);

      const result = await handScoreRepository.findByPlayerId(playerId);

      expect(result).toEqual(mockHandScores);
      expect(mockPrismaService.getClient().handScore.findMany).toHaveBeenCalledWith({
        where: { playerId },
        orderBy: { createdAt: 'asc' }
      });
    });

    it('should return empty array when no scores found for player', async () => {
      const playerId = 999;

      mockPrismaService.getClient().handScore.findMany.mockResolvedValue([]);

      const result = await handScoreRepository.findByPlayerId(playerId);

      expect(result).toEqual([]);
    });
  });

  describe('findByHandIdAndPlayerId', () => {
    it('should find specific hand score by hand ID and player ID', async () => {
      const handId = 101;
      const playerId = 1;
      const mockHandScore = {
        id: 201,
        handId,
        playerId,
        handPoints: 5,
        cumulativePoints: 15,
        heartsTaken: 5,
        queenOfSpadesTaken: false,
        shootTheMoonAchieved: false,
        createdAt: new Date()
      };

      mockPrismaService.getClient().handScore.findUnique.mockResolvedValue(mockHandScore);

      const result = await handScoreRepository.findByHandIdAndPlayerId(handId, playerId);

      expect(result).toEqual(mockHandScore);
      expect(mockPrismaService.getClient().handScore.findUnique).toHaveBeenCalledWith({
        where: {
          handId_playerId: {
            handId,
            playerId
          }
        }
      });
    });

    it('should return null when score not found', async () => {
      const handId = 999;
      const playerId = 999;

      mockPrismaService.getClient().handScore.findUnique.mockResolvedValue(null);

      const result = await handScoreRepository.findByHandIdAndPlayerId(handId, playerId);

      expect(result).toBeNull();
    });

    it('should handle database errors during specific find', async () => {
      const handId = 101;
      const playerId = 1;
      const error = new Error('Database specific find error');

      mockPrismaService.getClient().handScore.findUnique.mockRejectedValue(error);

      await expect(handScoreRepository.findByHandIdAndPlayerId(handId, playerId)).rejects.toThrow('Database specific find error');
    });
  });
});