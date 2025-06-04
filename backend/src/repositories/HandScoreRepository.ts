import { HandScore } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';
import { IHandScoreRepository, HandScoreData } from './interfaces/IHandScoreRepository';

export class HandScoreRepository implements IHandScoreRepository {
  private prismaService: PrismaService;

  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  /**
   * ハンドスコアを一括保存する（4プレイヤー分）
   * @param handId ハンドID
   * @param handScores ハンドスコアデータ配列
   * @returns 保存されたハンドスコア配列
   */
  async saveHandScores(handId: number, handScores: HandScoreData[]): Promise<HandScore[]> {
    const prisma = this.prismaService.getClient();
    
    // 一括作成
    await prisma.handScore.createMany({
      data: handScores.map(score => ({
        handId,
        playerId: score.playerId,
        handPoints: score.handPoints,
        cumulativePoints: score.cumulativePoints,
        heartsTaken: score.heartsTaken,
        queenOfSpadesTaken: score.queenOfSpadesTaken,
        shootTheMoonAchieved: score.shootTheMoonAchieved
      }))
    });

    // 作成されたレコードを取得して返す
    return await prisma.handScore.findMany({
      where: { handId },
      orderBy: { playerId: 'asc' }
    });
  }

  /**
   * ハンドIDでハンドスコアを検索する
   * @param handId ハンドID
   * @returns ハンドスコアの配列（プレイヤーID順）
   */
  async findByHandId(handId: number): Promise<HandScore[]> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.handScore.findMany({
      where: { handId },
      orderBy: { playerId: 'asc' }
    });
  }

  /**
   * プレイヤーIDでハンドスコア履歴を検索する
   * @param playerId プレイヤーID
   * @returns ハンドスコアの配列（作成日時順）
   */
  async findByPlayerId(playerId: number): Promise<HandScore[]> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.handScore.findMany({
      where: { playerId },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * ハンドIDとプレイヤーIDで特定のハンドスコアを検索する
   * @param handId ハンドID
   * @param playerId プレイヤーID
   * @returns ハンドスコア（存在しない場合はnull）
   */
  async findByHandIdAndPlayerId(handId: number, playerId: number): Promise<HandScore | null> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.handScore.findUnique({
      where: {
        handId_playerId: {
          handId,
          playerId
        }
      }
    });
  }
}