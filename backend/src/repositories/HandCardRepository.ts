import { HandCard, Prisma } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';

export type HandCardWithRelations = HandCard & {
  player: {
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
    sortOrder: number;
  };
};

export type HandCardWithCard = HandCard & {
  card: {
    id: number;
    suit: string;
    rank: string;
    code: string;
    pointValue: number;
    sortOrder: number;
  };
};

export class HandCardRepository {
  private prismaService: PrismaService;

  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  /**
   * ハンドカードを一括保存する
   * @param handId ハンドID
   * @param playerCards プレイヤーごとのカードIDマップ
   * @returns 保存結果
   */
  async saveHandCards(
    handId: number, 
    playerCards: Map<number, number[]>
  ): Promise<Prisma.BatchPayload> {
    const prisma = this.prismaService.getClient();
    
    const data: { handId: number; playerId: number; cardId: number }[] = [];
    
    for (const [playerId, cardIds] of playerCards) {
      for (const cardId of cardIds) {
        data.push({
          handId,
          playerId,
          cardId
        });
      }
    }
    
    return await prisma.handCard.createMany({
      data,
      skipDuplicates: true
    });
  }

  /**
   * ハンドIDでハンドカードを検索する（プレイヤー・カード情報付き）
   * @param handId ハンドID
   * @returns ハンドカードの配列
   */
  async findByHandId(handId: number): Promise<HandCardWithRelations[]> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.handCard.findMany({
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
    }) as HandCardWithRelations[];
  }

  /**
   * ハンドIDとプレイヤーIDでハンドカードを検索する（カード情報付き）
   * @param handId ハンドID
   * @param playerId プレイヤーID
   * @returns プレイヤーのハンドカードの配列
   */
  async findByHandIdAndPlayerId(handId: number, playerId: number): Promise<HandCardWithCard[]> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.handCard.findMany({
      where: { handId, playerId },
      include: {
        card: {
          select: { id: true, suit: true, rank: true, code: true, pointValue: true, sortOrder: true }
        }
      },
      orderBy: { card: { sortOrder: 'asc' } }
    }) as HandCardWithCard[];
  }

  /**
   * ハンドIDでプレイヤーごとのカード数を取得する
   * @param handId ハンドID
   * @returns プレイヤーIDとカード数のマップ
   */
  async getCardCountByPlayer(handId: number): Promise<Map<number, number>> {
    const prisma = this.prismaService.getClient();
    
    const result = await prisma.handCard.groupBy({
      by: ['playerId'],
      where: { handId },
      _count: {
        cardId: true
      }
    });
    
    const cardCountMap = new Map<number, number>();
    for (const item of result) {
      cardCountMap.set(item.playerId, item._count.cardId);
    }
    
    return cardCountMap;
  }

  /**
   * ハンドIDで総カード数を取得する
   * @param handId ハンドID
   * @returns 総カード数
   */
  async getTotalCardCount(handId: number): Promise<number> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.handCard.count({
      where: { handId }
    });
  }
}