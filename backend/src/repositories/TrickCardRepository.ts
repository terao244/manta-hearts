import { TrickCard } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';
import { ITrickCardRepository, TrickCardData } from './interfaces/ITrickCardRepository';

export class TrickCardRepository implements ITrickCardRepository {
  private prismaService: PrismaService;

  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  async saveTrickCard(trickId: number, trickCardData: TrickCardData): Promise<TrickCard> {
    const prisma = this.prismaService.getClient();
    
    return prisma.trickCard.create({
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
  }

  async saveTrickCards(trickId: number, trickCards: TrickCardData[]): Promise<TrickCard[]> {
    const prisma = this.prismaService.getClient();
    
    // 一括作成
    const data = trickCards.map(trickCard => ({
      trickId,
      playerId: trickCard.playerId,
      cardId: trickCard.cardId,
      playOrder: trickCard.playOrder,
    }));

    await prisma.trickCard.createMany({
      data,
    });
    
    // 作成されたレコードを取得
    return this.findByTrickId(trickId);
  }

  async findByTrickId(trickId: number): Promise<TrickCard[]> {
    const prisma = this.prismaService.getClient();
    
    return prisma.trickCard.findMany({
      where: { trickId },
      include: {
        player: true,
        card: true,
      },
      orderBy: { playOrder: 'asc' },
    });
  }

  async findByTrickIdAndPlayer(trickId: number, playerId: number): Promise<TrickCard | null> {
    const prisma = this.prismaService.getClient();
    
    return prisma.trickCard.findFirst({
      where: { 
        trickId,
        playerId,
      },
      include: {
        player: true,
        card: true,
      },
    });
  }
}