import { CardExchangeRepository } from '../../repositories/CardExchangeRepository';
import { CardExchangeData } from '../../repositories/interfaces/ICardExchangeRepository';
import { PrismaService } from '../../services/PrismaService';
import { createMockPrismaService } from '../../helpers/mockHelpers';

describe('CardExchangeRepository', () => {
  let cardExchangeRepository: CardExchangeRepository;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    jest.spyOn(PrismaService, 'getInstance').mockReturnValue(mockPrismaService as any);
    cardExchangeRepository = new CardExchangeRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveCardExchanges', () => {
    it('should save card exchanges and return saved records', async () => {
      const handId = 1;
      const exchanges: CardExchangeData[] = [
        { fromPlayerId: 1, toPlayerId: 2, cardId: 1, exchangeOrder: 1 },
        { fromPlayerId: 1, toPlayerId: 2, cardId: 2, exchangeOrder: 2 },
        { fromPlayerId: 1, toPlayerId: 2, cardId: 3, exchangeOrder: 3 },
      ];

      const mockSavedExchanges = exchanges.map((exchange, index) => ({
        id: index + 1,
        handId,
        ...exchange,
        createdAt: new Date(),
        fromPlayer: { id: exchange.fromPlayerId, name: `Player${exchange.fromPlayerId}` },
        toPlayer: { id: exchange.toPlayerId, name: `Player${exchange.toPlayerId}` },
        card: { id: exchange.cardId, suit: 'Hearts', rank: 'A' },
      }));

      mockPrismaService.getClient().cardExchange.createMany.mockResolvedValue({ count: 3 });
      mockPrismaService.getClient().cardExchange.findMany.mockResolvedValue(mockSavedExchanges as any);

      const result = await cardExchangeRepository.saveCardExchanges(handId, exchanges);

      expect(mockPrismaService.getClient().cardExchange.createMany).toHaveBeenCalledWith({
        data: exchanges.map(exchange => ({ handId, ...exchange })),
      });
      expect(result).toEqual(mockSavedExchanges);
    });

    it('should save exchanges for different exchange directions', async () => {
      const handId = 2;
      const exchanges: CardExchangeData[] = [
        { fromPlayerId: 1, toPlayerId: 2, cardId: 4, exchangeOrder: 1 }, // 左隣
        { fromPlayerId: 2, toPlayerId: 3, cardId: 5, exchangeOrder: 1 }, // 左隣
        { fromPlayerId: 3, toPlayerId: 4, cardId: 6, exchangeOrder: 1 }, // 左隣
        { fromPlayerId: 4, toPlayerId: 1, cardId: 7, exchangeOrder: 1 }, // 左隣
      ];

      mockPrismaService.getClient().cardExchange.createMany.mockResolvedValue({ count: 4 });
      mockPrismaService.getClient().cardExchange.findMany.mockResolvedValue([]);

      await cardExchangeRepository.saveCardExchanges(handId, exchanges);

      expect(mockPrismaService.getClient().cardExchange.createMany).toHaveBeenCalledWith({
        data: exchanges.map(exchange => ({ handId, ...exchange })),
      });
    });
  });

  describe('findByHandId', () => {
    it('should return all card exchanges for a hand ordered by player and exchange order', async () => {
      const handId = 1;
      const mockExchanges = [
        {
          id: 1,
          handId,
          fromPlayerId: 1,
          toPlayerId: 2,
          cardId: 1,
          exchangeOrder: 1,
          createdAt: new Date(),
          fromPlayer: { id: 1, name: 'Player1' },
          toPlayer: { id: 2, name: 'Player2' },
          card: { id: 1, suit: 'Hearts', rank: 'A' },
        },
        {
          id: 2,
          handId,
          fromPlayerId: 1,
          toPlayerId: 2,
          cardId: 2,
          exchangeOrder: 2,
          createdAt: new Date(),
          fromPlayer: { id: 1, name: 'Player1' },
          toPlayer: { id: 2, name: 'Player2' },
          card: { id: 2, suit: 'Hearts', rank: 'K' },
        },
      ];

      mockPrismaService.getClient().cardExchange.findMany.mockResolvedValue(mockExchanges as any);

      const result = await cardExchangeRepository.findByHandId(handId);

      expect(mockPrismaService.getClient().cardExchange.findMany).toHaveBeenCalledWith({
        where: { handId },
        include: {
          fromPlayer: true,
          toPlayer: true,
          card: true,
        },
        orderBy: [
          { fromPlayerId: 'asc' },
          { exchangeOrder: 'asc' },
        ],
      });
      expect(result).toEqual(mockExchanges);
    });

    it('should return empty array when no exchanges found', async () => {
      const handId = 999;
      mockPrismaService.getClient().cardExchange.findMany.mockResolvedValue([]);

      const result = await cardExchangeRepository.findByHandId(handId);

      expect(result).toEqual([]);
    });
  });

  describe('findByHandIdAndPlayer', () => {
    it('should return exchanges where player is either sender or receiver', async () => {
      const handId = 1;
      const playerId = 2;
      const mockExchanges = [
        {
          id: 1,
          handId,
          fromPlayerId: 1,
          toPlayerId: 2, // 受信者として
          cardId: 1,
          exchangeOrder: 1,
          createdAt: new Date(),
          fromPlayer: { id: 1, name: 'Player1' },
          toPlayer: { id: 2, name: 'Player2' },
          card: { id: 1, suit: 'Hearts', rank: 'A' },
        },
        {
          id: 2,
          handId,
          fromPlayerId: 2, // 送信者として
          toPlayerId: 3,
          cardId: 2,
          exchangeOrder: 1,
          createdAt: new Date(),
          fromPlayer: { id: 2, name: 'Player2' },
          toPlayer: { id: 3, name: 'Player3' },
          card: { id: 2, suit: 'Spades', rank: 'Q' },
        },
      ];

      mockPrismaService.getClient().cardExchange.findMany.mockResolvedValue(mockExchanges as any);

      const result = await cardExchangeRepository.findByHandIdAndPlayer(handId, playerId);

      expect(mockPrismaService.getClient().cardExchange.findMany).toHaveBeenCalledWith({
        where: { 
          handId,
          OR: [
            { fromPlayerId: playerId },
            { toPlayerId: playerId }
          ]
        },
        include: {
          fromPlayer: true,
          toPlayer: true,
          card: true,
        },
        orderBy: { exchangeOrder: 'asc' },
      });
      expect(result).toEqual(mockExchanges);
    });
  });
});