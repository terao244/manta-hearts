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
  players: Array<{
    id: number;
    name: string;
    position: 'North' | 'East' | 'South' | 'West';
    finalScore: number;
  }>;
}

export interface GameDetailData extends GameData {
  players: Array<{
    id: number;
    name: string;
    position: 'North' | 'East' | 'South' | 'West';
    finalScore: number;
  }>;
  hands: HandData[];
  scoreHistory: Array<{
    hand: number;
    scores: Record<number, number>;
  }>;
}

export interface HandData {
  id: number;
  handNumber: number;
  exchangeDirection: 'left' | 'right' | 'across' | 'none';
  heartsBroken: boolean;
  shootTheMoonPlayerId: number | null;
  shootTheMoonPlayerName: string | null;
  scores: Record<number, number>;
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
  handNumber: number;
  leadPlayerId: number;
  winnerId: number;
  points: number;
  cards: Array<{
    playerId: number;
    card: {
      id: number;
      suit: 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';
      rank: 'ACE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN' | 'EIGHT' | 'NINE' | 'TEN' | 'JACK' | 'QUEEN' | 'KING';
      code: string;
      pointValue: number;
      sortOrder: number;
    };
  }>;
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
          select: {
            playerId: true,
            playerPosition: true,
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

      // プレイヤー情報を作成
      // game.sessionsが空の場合はfinalScoresからプレイヤー情報を取得
      const players = game.sessions.length > 0
        ? game.sessions.map((session) => ({
            id: session.playerId,
            name: session.player.displayName,
            position: this.convertPlayerPosition(session.playerPosition),
            finalScore: finalScores.find(s => s.playerId === session.playerId)?.score || 0,
          }))
        : finalScores.map((score, index) => ({
            id: score.playerId,
            name: score.playerName,
            position: ['North', 'East', 'South', 'West'][index % 4] as 'North' | 'East' | 'South' | 'West',
            finalScore: score.score,
          }));

      return {
        id: game.id,
        startTime: game.startTime,
        endTime: game.endTime,
        status: game.status,
        winnerId: game.winnerId,
        winnerName: game.winner?.displayName || null,
        duration: game.duration,
        playerCount: players.length,
        finalScores,
        players,
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
          select: {
            playerId: true,
            playerPosition: true,
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

    // 交換方向を計算するヘルパー関数
    const getExchangeDirection = (handNumber: number): 'left' | 'right' | 'across' | 'none' => {
      const directions: ('left' | 'right' | 'across' | 'none')[] = ['left', 'right', 'across', 'none'];
      return directions[(handNumber - 1) % 4];
    };

    // ハンド詳細データを変換
    const hands: HandData[] = game.hands.map((hand) => ({
      id: hand.id,
      handNumber: hand.handNumber,
      exchangeDirection: getExchangeDirection(hand.handNumber),
      heartsBroken: hand.heartsBroken,
      shootTheMoonPlayerId: hand.shootTheMoonPlayerId,
      shootTheMoonPlayerName: hand.shootTheMoonPlayer?.displayName || null,
      scores: hand.scores.reduce((acc, score) => {
        acc[score.playerId] = score.handPoints;
        return acc;
      }, {} as Record<number, number>),
      tricks: hand.tricks.map((trick) => ({
        id: trick.id,
        trickNumber: trick.trickNumber,
        handNumber: hand.handNumber,
        leadPlayerId: trick.leadPlayerId,
        winnerId: trick.winnerPlayerId,
        points: trick.points,
        cards: trick.trickCards.map((trickCard) => ({
          playerId: trickCard.playerId,
          card: {
            id: 0, // カードIDは必要に応じて追加
            suit: trickCard.card.suit as 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES',
            rank: trickCard.card.rank as 'ACE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN' | 'EIGHT' | 'NINE' | 'TEN' | 'JACK' | 'QUEEN' | 'KING',
            code: trickCard.card.code,
            pointValue: trickCard.card.pointValue,
            sortOrder: 0,
          },
        })),
      })),
    }));

    // プレイヤー情報を取得
    // game.sessionsが空の場合はfinalScoresからプレイヤー情報を取得
    const players = game.sessions.length > 0 
      ? game.sessions.map((session) => ({
          id: session.playerId,
          name: session.player.displayName,
          position: this.convertPlayerPosition(session.playerPosition),
          finalScore: finalScores.find(s => s.playerId === session.playerId)?.score || 0,
        }))
      : finalScores.map((score, index) => ({
          id: score.playerId,
          name: score.playerName,
          position: ['North', 'East', 'South', 'West'][index % 4] as 'North' | 'East' | 'South' | 'West',
          finalScore: score.score,
        }));

    // スコア履歴を作成（フロントエンドで累積計算するため、各ハンドのスコアを返す）
    const scoreHistory = game.hands.map((hand) => ({
      hand: hand.handNumber,
      scores: hand.scores.reduce((acc, score) => {
        acc[score.playerId] = score.handPoints;
        return acc;
      }, {} as Record<number, number>),
    }));

    return {
      id: game.id,
      startTime: game.startTime,
      endTime: game.endTime,
      status: game.status,
      winnerId: game.winnerId,
      winnerName: game.winner?.displayName || null,
      duration: game.duration,
      playerCount: players.length,
      finalScores,
      players,
      hands,
      scoreHistory,
    };
  }

  async count(status?: GameStatus): Promise<number> {
    const where = status ? { status } : {};
    return await this.prisma.game.count({ where });
  }

  /**
   * PrismaのPlayerPositionを文字列に変換
   */
  private convertPlayerPosition(position: any): 'North' | 'East' | 'South' | 'West' {
    if (!position) {
      return 'North'; // デフォルト値
    }
    
    switch (position) {
      case 'NORTH':
        return 'North';
      case 'EAST':
        return 'East';
      case 'SOUTH':
        return 'South';
      case 'WEST':
        return 'West';
      default:
        return 'North'; // フォールバック
    }
  }
}