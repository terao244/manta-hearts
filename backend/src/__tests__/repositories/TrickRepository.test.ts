import { TrickRepository } from '../../repositories/TrickRepository';
import { TrickData } from '../../repositories/interfaces/ITrickRepository';
import { PrismaService } from '../../services/PrismaService';
import { createMockPrismaService } from '../../helpers/mockHelpers';

describe('TrickRepository', () => {
  let trickRepository: TrickRepository;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    jest.spyOn(PrismaService, 'getInstance').mockReturnValue(mockPrismaService as any);
    trickRepository = new TrickRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTrick', () => {
    it('should create a new trick with required fields', async () => {
      const handId = 1;
      const trickData: TrickData = {
        trickNumber: 1,
        winnerPlayerId: 2,
        points: 3,
        leadPlayerId: 1,
      };

      const mockTrick = {
        id: 101,
        handId,
        ...trickData,
        createdAt: new Date(),
        winner: { id: 2, name: 'Player2' },
        leadPlayer: { id: 1, name: 'Player1' },
        trickCards: [],
      };

      mockPrismaService.getClient().trick.create.mockResolvedValue(mockTrick as any);

      const result = await trickRepository.createTrick(handId, trickData);

      expect(mockPrismaService.getClient().trick.create).toHaveBeenCalledWith({
        data: {
          handId,
          trickNumber: trickData.trickNumber,
          winnerPlayerId: trickData.winnerPlayerId,
          points: trickData.points,
          leadPlayerId: trickData.leadPlayerId,
        },
        include: {
          winner: true,
          leadPlayer: true,
          trickCards: {
            include: {
              player: true,
              card: true,
            },
            orderBy: { playOrder: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockTrick);
    });

    it('should create trick with 0 points when no points trick', async () => {
      const handId = 1;
      const trickData: TrickData = {
        trickNumber: 2,
        winnerPlayerId: 3,
        points: 0,
        leadPlayerId: 2,
      };

      const mockTrick = {
        id: 102,
        handId,
        ...trickData,
        createdAt: new Date(),
        winner: { id: 3, name: 'Player3' },
        leadPlayer: { id: 2, name: 'Player2' },
        trickCards: [],
      };

      mockPrismaService.getClient().trick.create.mockResolvedValue(mockTrick as any);

      const result = await trickRepository.createTrick(handId, trickData);

      expect(result).toEqual(mockTrick);
    });
  });

  describe('findByHandId', () => {
    it('should return all tricks for a hand ordered by trick number', async () => {
      const handId = 1;
      const mockTricks = [
        {
          id: 101,
          handId,
          trickNumber: 1,
          winnerPlayerId: 2,
          points: 3,
          leadPlayerId: 1,
          createdAt: new Date(),
          winner: { id: 2, name: 'Player2' },
          leadPlayer: { id: 1, name: 'Player1' },
          trickCards: [],
        },
        {
          id: 102,
          handId,
          trickNumber: 2,
          winnerPlayerId: 3,
          points: 0,
          leadPlayerId: 2,
          createdAt: new Date(),
          winner: { id: 3, name: 'Player3' },
          leadPlayer: { id: 2, name: 'Player2' },
          trickCards: [],
        },
      ];

      mockPrismaService.getClient().trick.findMany.mockResolvedValue(mockTricks as any);

      const result = await trickRepository.findByHandId(handId);

      expect(mockPrismaService.getClient().trick.findMany).toHaveBeenCalledWith({
        where: { handId },
        include: {
          winner: true,
          leadPlayer: true,
          trickCards: {
            include: {
              player: true,
              card: true,
            },
            orderBy: { playOrder: 'asc' },
          },
        },
        orderBy: { trickNumber: 'asc' },
      });
      expect(result).toEqual(mockTricks);
    });

    it('should return empty array when no tricks found', async () => {
      const handId = 999;
      mockPrismaService.getClient().trick.findMany.mockResolvedValue([]);

      const result = await trickRepository.findByHandId(handId);

      expect(result).toEqual([]);
    });
  });

  describe('findByHandIdAndTrickNumber', () => {
    it('should return specific trick by hand ID and trick number', async () => {
      const handId = 1;
      const trickNumber = 5;
      const mockTrick = {
        id: 105,
        handId,
        trickNumber,
        winnerPlayerId: 4,
        points: 14, // ハート1枚 + スペードQ
        leadPlayerId: 3,
        createdAt: new Date(),
        winner: { id: 4, name: 'Player4' },
        leadPlayer: { id: 3, name: 'Player3' },
        trickCards: [
          {
            id: 1,
            playerId: 3,
            card: { id: 1, suit: 'Hearts', rank: 'A' },
            playOrder: 1,
          },
          {
            id: 2,
            playerId: 4,
            card: { id: 39, suit: 'Spades', rank: 'Q' },
            playOrder: 2,
          },
        ],
      };

      mockPrismaService.getClient().trick.findUnique.mockResolvedValue(mockTrick as any);

      const result = await trickRepository.findByHandIdAndTrickNumber(handId, trickNumber);

      expect(mockPrismaService.getClient().trick.findUnique).toHaveBeenCalledWith({
        where: {
          handId_trickNumber: {
            handId,
            trickNumber,
          },
        },
        include: {
          winner: true,
          leadPlayer: true,
          trickCards: {
            include: {
              player: true,
              card: true,
            },
            orderBy: { playOrder: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockTrick);
    });

    it('should return null when trick not found', async () => {
      const handId = 1;
      const trickNumber = 999;
      mockPrismaService.getClient().trick.findUnique.mockResolvedValue(null);

      const result = await trickRepository.findByHandIdAndTrickNumber(handId, trickNumber);

      expect(result).toBeNull();
    });
  });

  describe('updateTrick', () => {
    it('should update trick fields', async () => {
      const trickId = 101;
      const updates: Partial<TrickData> = {
        points: 5,
        winnerPlayerId: 3,
      };

      const mockUpdatedTrick = {
        id: trickId,
        handId: 1,
        trickNumber: 1,
        winnerPlayerId: 3,
        points: 5,
        leadPlayerId: 1,
        createdAt: new Date(),
        winner: { id: 3, name: 'Player3' },
        leadPlayer: { id: 1, name: 'Player1' },
        trickCards: [],
      };

      mockPrismaService.getClient().trick.update.mockResolvedValue(mockUpdatedTrick as any);

      const result = await trickRepository.updateTrick(trickId, updates);

      expect(mockPrismaService.getClient().trick.update).toHaveBeenCalledWith({
        where: { id: trickId },
        data: updates,
        include: {
          winner: true,
          leadPlayer: true,
          trickCards: {
            include: {
              player: true,
              card: true,
            },
            orderBy: { playOrder: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockUpdatedTrick);
    });
  });
});