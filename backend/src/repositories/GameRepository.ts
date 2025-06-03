import { PrismaClient, GameStatus } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';
import { IGameRepository } from './interfaces/IGameRepository';

export interface GameData {
  id: number;
  startTime: Date;
  endTime: Date | null;
  status: GameStatus;
  winnerId: number | null;
  winnerName: string | null;
  duration: number | null;
  playerCount: number;
  finalScores: { playerId: number; playerName: string; score: number }[];
}

export interface GameDetailData extends GameData {
  hands: HandData[];
}

export interface HandData {
  id: number;
  handNumber: number;
  heartsBroken: boolean;
  shootTheMoonPlayerId: number | null;
  shootTheMoonPlayerName: string | null;
  scores: HandScoreData[];
  tricks: TrickData[];
}

export interface HandScoreData {
  playerId: number;
  playerName: string;
  handPoints: number;
  cumulativePoints: number;
  heartsTaken: number;
  queenOfSpadesTaken: boolean;
  shootTheMoonAchieved: boolean;
}

export interface TrickData {
  id: number;
  trickNumber: number;
  winnerPlayerId: number;
  winnerPlayerName: string;
  points: number;
  leadPlayerId: number;
  leadPlayerName: string;
  cards: TrickCardData[];
}

export interface TrickCardData {
  playerId: number;
  playerName: string;
  cardCode: string;
  suit: string;
  rank: string;
  pointValue: number;
  playOrder: number;
}

export interface GameListQuery {
  page?: number;
  limit?: number;
  status?: GameStatus;
  playerId?: number;
  sortBy?: 'startTime' | 'endTime' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export class GameRepository implements IGameRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance().getClient();
  }

  async findAll(query: GameListQuery = {}): Promise<{ games: GameData[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      playerId,
      sortBy = 'startTime',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * limit;
    
    // WHERE条件の構築
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (playerId) {
      where.sessions = {
        some: {
          playerId: playerId,
        },
      };
    }

    // ソート順の構築
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // 総数を取得
    const total = await this.prisma.game.count({ where });

    // ゲーム一覧を取得
    const games = await this.prisma.game.findMany({
      where,
      include: {
        winner: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        sessions: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
        hands: {
          include: {
            scores: {
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                  },
                },
              },
            },
          },
          orderBy: { handNumber: 'desc' },
          take: 1, // 最新のハンドのみ取得
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    });

    // レスポンス形式に変換
    const gameData: GameData[] = games.map((game) => {
      // 最終スコアを計算（最新ハンドの累積スコア）
      const finalScores = game.hands[0]?.scores?.map((score) => ({
        playerId: score.playerId,
        playerName: score.player.displayName,
        score: score.cumulativePoints,
      })) || [];

      return {
        id: game.id,
        startTime: game.startTime,
        endTime: game.endTime,
        status: game.status,
        winnerId: game.winnerId,
        winnerName: game.winner?.displayName || null,
        duration: game.duration,
        playerCount: game.sessions.length,
        finalScores,
      };
    });

    return { games: gameData, total };
  }

  async findById(id: number): Promise<GameDetailData | null> {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        winner: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        sessions: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
        hands: {
          include: {
            shootTheMoonPlayer: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
            scores: {
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                  },
                },
              },
            },
            tricks: {
              include: {
                winner: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                  },
                },
                leadPlayer: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                  },
                },
                trickCards: {
                  include: {
                    player: {
                      select: {
                        id: true,
                        name: true,
                        displayName: true,
                      },
                    },
                    card: {
                      select: {
                        code: true,
                        suit: true,
                        rank: true,
                        pointValue: true,
                      },
                    },
                  },
                  orderBy: { playOrder: 'asc' },
                },
              },
              orderBy: { trickNumber: 'asc' },
            },
          },
          orderBy: { handNumber: 'asc' },
        },
      },
    });

    if (!game) {
      return null;
    }

    // 最終スコアを計算（最新ハンドの累積スコア）
    const lastHand = game.hands[game.hands.length - 1];
    const finalScores = lastHand?.scores?.map((score) => ({
      playerId: score.playerId,
      playerName: score.player.displayName,
      score: score.cumulativePoints,
    })) || [];

    // ハンド詳細データを変換
    const hands: HandData[] = game.hands.map((hand) => ({
      id: hand.id,
      handNumber: hand.handNumber,
      heartsBroken: hand.heartsBroken,
      shootTheMoonPlayerId: hand.shootTheMoonPlayerId,
      shootTheMoonPlayerName: hand.shootTheMoonPlayer?.displayName || null,
      scores: hand.scores.map((score) => ({
        playerId: score.playerId,
        playerName: score.player.displayName,
        handPoints: score.handPoints,
        cumulativePoints: score.cumulativePoints,
        heartsTaken: score.heartsTaken,
        queenOfSpadesTaken: score.queenOfSpadesTaken,
        shootTheMoonAchieved: score.shootTheMoonAchieved,
      })),
      tricks: hand.tricks.map((trick) => ({
        id: trick.id,
        trickNumber: trick.trickNumber,
        winnerPlayerId: trick.winnerPlayerId,
        winnerPlayerName: trick.winner.displayName,
        points: trick.points,
        leadPlayerId: trick.leadPlayerId,
        leadPlayerName: trick.leadPlayer.displayName,
        cards: trick.trickCards.map((trickCard) => ({
          playerId: trickCard.playerId,
          playerName: trickCard.player.displayName,
          cardCode: trickCard.card.code,
          suit: trickCard.card.suit,
          rank: trickCard.card.rank,
          pointValue: trickCard.card.pointValue,
          playOrder: trickCard.playOrder,
        })),
      })),
    }));

    return {
      id: game.id,
      startTime: game.startTime,
      endTime: game.endTime,
      status: game.status,
      winnerId: game.winnerId,
      winnerName: game.winner?.displayName || null,
      duration: game.duration,
      playerCount: game.sessions.length,
      finalScores,
      hands,
    };
  }

  async count(status?: GameStatus): Promise<number> {
    const where = status ? { status } : {};
    return await this.prisma.game.count({ where });
  }
}