import { PrismaService } from './PrismaService';
import Container from '../container/Container';
import { HandScoreData } from '../repositories/interfaces/IHandScoreRepository';
import { GameEngine } from '../game/GameEngine';
import { GameState } from '../game/GameState';
import { Card } from '../game/Card';

export interface HandPersistenceData {
  gameId: number;
  handNumber: number;
  heartsBroken?: boolean;
  shootTheMoonPlayerId?: number | null;
  handCards: Array<{
    playerId: number;
    cardIds: number[];
  }>;
  cardExchanges?: Array<{
    fromPlayerId: number;
    toPlayerId: number;
    cardId: number;
    exchangeOrder: number;
  }>;
  tricks: Array<{
    trickNumber: number;
    winnerPlayerId: number;
    points: number;
    leadPlayerId: number;
    trickCards: Array<{
      playerId: number;
      cardId: number;
      playOrder: number;
    }>;
  }>;
  handScores: HandScoreData[];
}

export interface TrickPersistenceData {
  handId: number;
  trickNumber: number;
  winnerPlayerId: number;
  points: number;
  leadPlayerId: number;
  trickCards: Array<{
    playerId: number;
    cardId: number;
    playOrder: number;
  }>;
}

/**
 * ゲーム永続化統括サービス
 * 複数のRepositoryを使用したトランザクション管理とバッチ処理を提供
 */
export class GamePersistenceService {
  private static instance: GamePersistenceService;
  private prismaService: PrismaService;
  private container: typeof Container;

  private constructor() {
    this.prismaService = PrismaService.getInstance();
    this.container = Container;
  }

  public static getInstance(): GamePersistenceService {
    if (!GamePersistenceService.instance) {
      GamePersistenceService.instance = new GamePersistenceService();
    }
    return GamePersistenceService.instance;
  }

  /**
   * ハンド開始時の永続化処理（ハンド作成 + カード配布）
   * @param gameId ゲームID
   * @param handNumber ハンド番号
   * @param playerCards プレイヤー別カード配布情報
   * @returns 作成されたハンドID
   */
  async persistHandStart(
    gameId: number,
    handNumber: number,
    playerCards: Map<number, Card[]>
  ): Promise<number> {
    const prisma = this.prismaService.getClient();
    
    return await prisma.$transaction(async (tx) => {
      // 1. ハンド作成
      const hand = await tx.hand.create({
        data: {
          gameId,
          handNumber,
          heartsBroken: false,
          shootTheMoonPlayerId: null
        }
      });

      // 2. ハンドカード一括保存
      const handCardData = [];
      for (const [playerId, cards] of playerCards) {
        for (const card of cards) {
          handCardData.push({
            handId: hand.id,
            playerId,
            cardId: card.id
          });
        }
      }

      if (handCardData.length > 0) {
        await tx.handCard.createMany({
          data: handCardData
        });
      }

      console.log(`Hand ${handNumber} and cards persisted for game ${gameId}, handId: ${hand.id}`);
      return hand.id;
    });
  }

  /**
   * カード交換永続化処理
   * @param handId ハンドID
   * @param exchanges カード交換情報
   */
  async persistCardExchanges(
    handId: number,
    exchanges: Array<{
      fromPlayerId: number;
      toPlayerId: number;
      cardId: number;
      exchangeOrder: number;
    }>
  ): Promise<void> {
    const prisma = this.prismaService.getClient();

    if (exchanges.length === 0) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.cardExchange.createMany({
        data: exchanges.map(exchange => ({
          handId,
          fromPlayerId: exchange.fromPlayerId,
          toPlayerId: exchange.toPlayerId,
          cardId: exchange.cardId,
          exchangeOrder: exchange.exchangeOrder
        }))
      });

      console.log(`${exchanges.length} card exchanges persisted for hand ${handId}`);
    });
  }

  /**
   * トリック永続化処理（トリック作成 + トリックカード保存）
   * @param trickData トリック永続化データ
   * @returns 作成されたトリックID
   */
  async persistTrick(trickData: TrickPersistenceData): Promise<number> {
    const prisma = this.prismaService.getClient();

    return await prisma.$transaction(async (tx) => {
      // 1. トリック作成
      const trick = await tx.trick.create({
        data: {
          handId: trickData.handId,
          trickNumber: trickData.trickNumber,
          winnerPlayerId: trickData.winnerPlayerId,
          points: trickData.points,
          leadPlayerId: trickData.leadPlayerId
        }
      });

      // 2. トリックカード一括保存
      if (trickData.trickCards.length > 0) {
        await tx.trickCard.createMany({
          data: trickData.trickCards.map(card => ({
            trickId: trick.id,
            playerId: card.playerId,
            cardId: card.cardId,
            playOrder: card.playOrder
          }))
        });
      }

      console.log(`Trick ${trickData.trickNumber} and cards persisted for hand ${trickData.handId}, trickId: ${trick.id}`);
      return trick.id;
    });
  }

  /**
   * ハンド完了時の統合永続化処理
   * @param handId ハンドID
   * @param handNumber ハンド番号
   * @param heartsBroken ハートブレイク状態
   * @param shootTheMoonPlayerId シュートザムーンプレイヤーID
   * @param handScores ハンドスコア詳細
   */
  async persistHandCompletion(
    handId: number,
    handNumber: number,
    heartsBroken: boolean,
    shootTheMoonPlayerId: number | null,
    handScores: HandScoreData[]
  ): Promise<void> {
    const prisma = this.prismaService.getClient();

    await prisma.$transaction(async (tx) => {
      // 1. ハンド情報更新
      const updates: any = {};
      if (heartsBroken) {
        updates.heartsBroken = true;
      }
      if (shootTheMoonPlayerId) {
        updates.shootTheMoonPlayerId = shootTheMoonPlayerId;
      }

      if (Object.keys(updates).length > 0) {
        await tx.hand.update({
          where: { id: handId },
          data: updates
        });
      }

      // 2. ハンドスコア一括保存
      if (handScores.length > 0) {
        await tx.handScore.createMany({
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
      }

      console.log(`Hand ${handNumber} completion persisted with ${handScores.length} scores`);
    });
  }

  /**
   * ゲーム完了時の永続化処理
   * @param gameId ゲームID
   * @param winnerId 勝者プレイヤーID
   * @param duration ゲーム時間（分）
   */
  async persistGameCompletion(
    gameId: number,
    winnerId: number,
    duration: number
  ): Promise<void> {
    const prisma = this.prismaService.getClient();

    await prisma.$transaction(async (tx) => {
      await tx.game.update({
        where: { id: gameId },
        data: {
          status: 'FINISHED',
          winnerId,
          duration,
          endTime: new Date()
        }
      });

      console.log(`Game ${gameId} completion persisted, winner: ${winnerId}, duration: ${duration} minutes`);
    });
  }

  /**
   * エラー発生時のリトライ機能付き永続化処理
   * @param operation 実行する処理
   * @param maxRetries 最大リトライ回数
   * @param retryDelay リトライ間隔（ミリ秒）
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Persistence operation failed (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    const finalError = lastError || new Error('Unknown error occurred during retry attempts');
    console.error(`Persistence operation failed after ${maxRetries} attempts:`, finalError);
    throw finalError;
  }

  /**
   * バッチ処理での大量データ保存の最適化
   * @param batchOperations バッチ操作の配列
   * @param batchSize バッチサイズ
   */
  async executeBatchOperations<T>(
    batchOperations: Array<() => Promise<T>>,
    batchSize: number = 10
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < batchOperations.length; i += batchSize) {
      const batch = batchOperations.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(operation => operation())
      );
      results.push(...batchResults);

      // バッチ間で短時間休止（DB負荷軽減）
      if (i + batchSize < batchOperations.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}