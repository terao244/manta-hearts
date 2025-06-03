import { Hand } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';

export interface HandUpdateData {
  heartsBroken?: boolean;
  shootTheMoonPlayerId?: number | null;
}

export class HandRepository {
  private prismaService: PrismaService;

  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  /**
   * 新しいハンドを作成する
   * @param gameId ゲームID
   * @param handNumber ハンド番号
   * @param heartsBroken ハートブレイク状態（オプション）
   * @param shootTheMoonPlayerId シュートザムーンプレイヤーID（オプション）
   * @returns 作成されたハンド
   */
  async createHand(
    gameId: number, 
    handNumber: number, 
    heartsBroken: boolean = false, 
    shootTheMoonPlayerId?: number | null
  ): Promise<Hand> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.hand.create({
      data: {
        gameId,
        handNumber,
        heartsBroken,
        shootTheMoonPlayerId: shootTheMoonPlayerId || null
      }
    });
  }

  /**
   * 既存のハンドを更新する
   * @param handId ハンドID
   * @param updates 更新データ
   * @returns 更新されたハンド
   */
  async updateHand(handId: number, updates: HandUpdateData): Promise<Hand> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.hand.update({
      where: { id: handId },
      data: updates
    });
  }

  /**
   * ゲームIDでハンドを検索する
   * @param gameId ゲームID
   * @returns ハンドの配列（ハンド番号順）
   */
  async findByGameId(gameId: number): Promise<Hand[]> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.hand.findMany({
      where: { gameId },
      orderBy: { handNumber: 'asc' }
    });
  }

  /**
   * ハンドIDでハンドを検索する
   * @param handId ハンドID
   * @returns ハンド（存在しない場合はnull）
   */
  async findById(handId: number): Promise<Hand | null> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.hand.findUnique({
      where: { id: handId }
    });
  }

  /**
   * ゲームIDとハンド番号でハンドを検索する
   * @param gameId ゲームID
   * @param handNumber ハンド番号
   * @returns ハンド（存在しない場合はnull）
   */
  async findByGameIdAndHandNumber(gameId: number, handNumber: number): Promise<Hand | null> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.hand.findUnique({
      where: {
        gameId_handNumber: {
          gameId,
          handNumber
        }
      }
    });
  }
}