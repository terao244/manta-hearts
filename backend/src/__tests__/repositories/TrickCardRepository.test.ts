import { TrickCardRepository } from '../../repositories/TrickCardRepository';
import { TrickCardData } from '../../repositories/interfaces/ITrickCardRepository';
import { PrismaService } from '../../services/PrismaService';
import { createMockPrismaService } from '../../helpers/mockHelpers';

describe('TrickCardRepository', () => {
  let trickCardRepository: TrickCardRepository;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    jest.spyOn(PrismaService, 'getInstance').mockReturnValue(mockPrismaService as any);
    trickCardRepository = new TrickCardRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTrickCard', () => {
    it('should save a single trick card', async () => {
      const trickId = 1;
      const trickCardData: TrickCardData = {
        playerId: 1,
        cardId: 14, // スペードA
        playOrder: 1,
      };

      const mockTrickCard = {
        id: 1,
        trickId,
        ...trickCardData,
        createdAt: new Date(),
        player: { id: 1, name: 'Player1' },
        card: { id: 14, suit: 'Spades', rank: 'A' },
      };

      mockPrismaService.getClient().trickCard.create.mockResolvedValue(mockTrickCard as any);

      const result = await trickCardRepository.saveTrickCard(trickId, trickCardData);

      expect(mockPrismaService.getClient().trickCard.create).toHaveBeenCalledWith({
        data: {
          trickId,
          playerId: trickCardData.playerId,
          cardId: trickCardData.cardId,
          playOrder: trickCardData.playOrder,
        },
        include: {
          player: true,
          card: true,
        },
      });
      expect(result).toEqual(mockTrickCard);
    });
  });

  describe('saveTrickCards', () => {
    it('should save multiple trick cards in bulk', async () => {
      const trickId = 1;
      const trickCards: TrickCardData[] = [
        { playerId: 1, cardId: 14, playOrder: 1 }, // スペードA
        { playerId: 2, cardId: 27, playOrder: 2 }, // ハート2
        { playerId: 3, cardId: 40, playOrder: 3 }, // ダイヤ3
        { playerId: 4, cardId: 1, playOrder: 4 },  // クラブ4
      ];

      const mockSavedTrickCards = trickCards.map((card, index) => ({
        id: index + 1,
        trickId,
        ...card,
        createdAt: new Date(),
        player: { id: card.playerId, name: `Player${card.playerId}` },
        card: { id: card.cardId, suit: 'Unknown', rank: 'Unknown' },
      }));

      mockPrismaService.getClient().trickCard.createMany.mockResolvedValue({ count: 4 });
      mockPrismaService.getClient().trickCard.findMany.mockResolvedValue(mockSavedTrickCards as any);

      const result = await trickCardRepository.saveTrickCards(trickId, trickCards);

      expect(mockPrismaService.getClient().trickCard.createMany).toHaveBeenCalledWith({
        data: trickCards.map(card => ({ trickId, ...card })),
      });
      expect(result).toEqual(mockSavedTrickCards);
    });

    it('should handle empty trick cards array', async () => {
      const trickId = 1;
      const trickCards: TrickCardData[] = [];

      mockPrismaService.getClient().trickCard.createMany.mockResolvedValue({ count: 0 });
      mockPrismaService.getClient().trickCard.findMany.mockResolvedValue([]);

      const result = await trickCardRepository.saveTrickCards(trickId, trickCards);

      expect(result).toEqual([]);
    });
  });

  describe('findByTrickId', () => {
    it('should return all trick cards for a trick ordered by play order', async () => {
      const trickId = 1;
      const mockTrickCards = [
        {
          id: 1,
          trickId,
          playerId: 1,
          cardId: 14,
          playOrder: 1,
          createdAt: new Date(),
          player: { id: 1, name: 'Player1' },
          card: { id: 14, suit: 'Spades', rank: 'A' },
        },
        {
          id: 2,
          trickId,
          playerId: 2,
          cardId: 39,
          playOrder: 2,
          createdAt: new Date(),
          player: { id: 2, name: 'Player2' },
          card: { id: 39, suit: 'Spades', rank: 'Q' },
        },
        {
          id: 3,
          trickId,
          playerId: 3,
          cardId: 27,
          playOrder: 3,
          createdAt: new Date(),
          player: { id: 3, name: 'Player3' },
          card: { id: 27, suit: 'Hearts', rank: '2' },
        },
        {
          id: 4,
          trickId,
          playerId: 4,
          cardId: 40,
          playOrder: 4,
          createdAt: new Date(),
          player: { id: 4, name: 'Player4' },
          card: { id: 40, suit: 'Diamonds', rank: '3' },
        },
      ];

      mockPrismaService.getClient().trickCard.findMany.mockResolvedValue(mockTrickCards as any);

      const result = await trickCardRepository.findByTrickId(trickId);

      expect(mockPrismaService.getClient().trickCard.findMany).toHaveBeenCalledWith({
        where: { trickId },
        include: {
          player: true,
          card: true,
        },
        orderBy: { playOrder: 'asc' },
      });
      expect(result).toEqual(mockTrickCards);
    });

    it('should return empty array when no trick cards found', async () => {
      const trickId = 999;
      mockPrismaService.getClient().trickCard.findMany.mockResolvedValue([]);

      const result = await trickCardRepository.findByTrickId(trickId);

      expect(result).toEqual([]);
    });
  });

  describe('findByTrickIdAndPlayer', () => {
    it('should return specific trick card by trick ID and player ID', async () => {
      const trickId = 1;
      const playerId = 2;
      const mockTrickCard = {
        id: 2,
        trickId,
        playerId,
        cardId: 39,
        playOrder: 2,
        createdAt: new Date(),
        player: { id: playerId, name: 'Player2' },
        card: { id: 39, suit: 'Spades', rank: 'Q' },
      };

      mockPrismaService.getClient().trickCard.findFirst.mockResolvedValue(mockTrickCard as any);

      const result = await trickCardRepository.findByTrickIdAndPlayer(trickId, playerId);

      expect(mockPrismaService.getClient().trickCard.findFirst).toHaveBeenCalledWith({
        where: { 
          trickId,
          playerId,
        },
        include: {
          player: true,
          card: true,
        },
      });
      expect(result).toEqual(mockTrickCard);
    });

    it('should return null when trick card not found', async () => {
      const trickId = 1;
      const playerId = 999;
      mockPrismaService.getClient().trickCard.findFirst.mockResolvedValue(null);

      const result = await trickCardRepository.findByTrickIdAndPlayer(trickId, playerId);

      expect(result).toBeNull();
    });
  });
});