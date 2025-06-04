import { CardExchange } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';
import { ICardExchangeRepository, CardExchangeData } from './interfaces/ICardExchangeRepository';

export type CardExchangeWithRelations = CardExchange & {
  fromPlayer: {
    id: number;
    name: string;
    displayName: string;
  };
  toPlayer: {
    id: number;
    name: string;
    displayName: string;
  };
  card: {
    id: number;
    suit: string;
    rank: string;
    code: string;
    pointValue: number;
  };
};

export class CardExchangeRepository implements ICardExchangeRepository {
  private prismaService: PrismaService;

  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  async saveCardExchanges(handId: number, exchanges: CardExchangeData[]): Promise<CardExchangeWithRelations[]> {
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

  async findByHandId(handId: number): Promise<CardExchangeWithRelations[]> {
    const prisma = this.prismaService.getClient();
    const result = await prisma.cardExchange.findMany({
      where: { handId },
      include: {
        fromPlayer: {
          select: { id: true, name: true, displayName: true }
        },
        toPlayer: {
          select: { id: true, name: true, displayName: true }
        },
        card: {
          select: { id: true, suit: true, rank: true, code: true, pointValue: true }
        },
      },
      orderBy: [
        { fromPlayerId: 'asc' },
        { exchangeOrder: 'asc' },
      ],
    });
    return result as unknown as CardExchangeWithRelations[];
  }

  async findByHandIdAndPlayer(handId: number, playerId: number): Promise<CardExchangeWithRelations[]> {
    const prisma = this.prismaService.getClient();
    const result = await prisma.cardExchange.findMany({
      where: { 
        handId,
        OR: [
          { fromPlayerId: playerId },
          { toPlayerId: playerId }
        ]
      },
      include: {
        fromPlayer: {
          select: { id: true, name: true, displayName: true }
        },
        toPlayer: {
          select: { id: true, name: true, displayName: true }
        },
        card: {
          select: { id: true, suit: true, rank: true, code: true, pointValue: true }
        },
      },
      orderBy: { exchangeOrder: 'asc' },
    });
    return result as unknown as CardExchangeWithRelations[];
  }
}