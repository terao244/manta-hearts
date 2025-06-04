import { CardExchange } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';
import { ICardExchangeRepository, CardExchangeData } from './interfaces/ICardExchangeRepository';

export class CardExchangeRepository implements ICardExchangeRepository {
  private prismaService: PrismaService;

  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  async saveCardExchanges(handId: number, exchanges: CardExchangeData[]): Promise<CardExchange[]> {
    const prisma = this.prismaService.getClient();
    const data = exchanges.map(exchange => ({
      handId,
      fromPlayerId: exchange.fromPlayerId,
      toPlayerId: exchange.toPlayerId,
      cardId: exchange.cardId,
      exchangeOrder: exchange.exchangeOrder,
    }));

    await prisma.cardExchange.createMany({
      data,
    });
    
    return this.findByHandId(handId);
  }

  async findByHandId(handId: number): Promise<CardExchange[]> {
    const prisma = this.prismaService.getClient();
    return prisma.cardExchange.findMany({
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
  }

  async findByHandIdAndPlayer(handId: number, playerId: number): Promise<CardExchange[]> {
    const prisma = this.prismaService.getClient();
    return prisma.cardExchange.findMany({
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
  }
}