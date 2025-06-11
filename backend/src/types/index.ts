// Prismaから生成される型をエクスポート
export * from '@prisma/client';

// エモート関連の型定義
export type EmoteType = '👎' | '🔥' | '🚮';

// 基本的なゲーム関連の型定義
export interface PlayerInfo {
  id: number;
  name: string;
  displayName: string;
  displayOrder: number;
  isActive: boolean;
  position?: PlayerPosition;
  playerPosition?: PlayerPosition; // GameSessionから取得した席順情報
}

export interface CardInfo {
  id: number;
  suit: 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';
  rank:
    | 'ACE'
    | 'TWO'
    | 'THREE'
    | 'FOUR'
    | 'FIVE'
    | 'SIX'
    | 'SEVEN'
    | 'EIGHT'
    | 'NINE'
    | 'TEN'
    | 'JACK'
    | 'QUEEN'
    | 'KING';
  code: string;
  pointValue: number;
  sortOrder: number;
}

// Socket.io関連の型定義
export interface ServerToClientEvents {
  gameStateChanged: (gameStateUpdate: GameStateUpdate) => void;
  playerJoined: (playerId: number) => void;
  playerLeft: (playerId: number) => void;
  handStarted: (handNumber: number) => void;
  cardsDealt: (cards: CardInfo[]) => void;
  handUpdated: (cards: CardInfo[]) => void;
  exchangePhaseStarted: (direction: 'left' | 'right' | 'across' | 'none') => void;
  exchangeProgress: (progress: { exchangedPlayers: number[]; remainingPlayers: number[] }) => void;
  playingPhaseStarted: (leadPlayerId: number) => void;
  cardPlayed: (playData: { playerId: number; card: CardInfo }) => void;
  trickCompleted: (trickResult: { trickNumber: number; winnerId: number; points: number }) => void;
  handScoreUpdate: (currentHandScores: Record<number, number>) => void;
  handCompleted: (handResult: { handNumber: number; scores: Record<number, number> }) => void;
  scoreHistoryUpdate: (scoreHistory: Array<{ hand: number; scores: Record<number, number> }>) => void;
  gameCompleted: (gameResult: { 
    gameId: number;
    winnerId: number | null; 
    finalScores: Record<number, number>; 
    rankings?: Array<{ playerId: number; rank: number; score: number }>; 
    scoreHistory: Array<{ hand: number; scores: Record<number, number> }>; 
    completedAt: string;
  }) => void;
  gameContinuedFromTie: (tieResult: {
    message: string;
    finalScores: Record<number, number>;
    gameId: number;
    completedAt: string;
  }) => void;
  receiveEmote: (emoteData: { playerId: number; emoteType: EmoteType }) => void;
  error: (error: string) => void;
  connectionStatus: (
    status: 'connected' | 'disconnected' | 'reconnected'
  ) => void;
  ping: () => void;
}

export interface ClientToServerEvents {
  login: (
    playerId: number,
    callback: (success: boolean, playerInfo?: PlayerInfo) => void
  ) => void;
  joinGame: (
    playerId: number,
    callback: (success: boolean, gameInfo?: GameInfo) => void
  ) => void;
  playCard: (
    cardId: number,
    callback: (success: boolean, error?: string) => void
  ) => void;
  exchangeCards: (
    cardIds: number[],
    callback: (success: boolean, error?: string) => void
  ) => void;
  getValidCards: (callback: (validCardIds: number[]) => void) => void;
  sendEmote: (emoteType: EmoteType) => void;
  disconnect: () => void;
  reconnect: () => void;
  pong: () => void;
}

export interface InterServerEvents {
  // サーバー間通信（今回は使用しない）
}

export interface SocketData {
  playerId?: number;
  playerName?: string;
  gameId?: number;
}

// Socket.io サーバーソケット型
import { Socket } from 'socket.io';
export type ServerSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// ゲーム状態関連の型定義
export interface GameInfo {
  gameId: number;
  status: string;
  players: Array<{
    id: number;
    name: string;
    position: 'North' | 'East' | 'South' | 'West';
    score: number;
  }>;
  phase: string;
  currentTurn?: number;
  heartsBroken: boolean;
  tricks: Array<any>;
  scores: Record<number, number>;
  scoreHistory: Array<{ hand: number; scores: Record<number, number> }>;
  hand?: CardInfo[];
}

export interface GameStateUpdate {
  gameId: number;
  status: string;
  players: PlayerInfo[];
  phase: string;
  currentTurn?: number;
  currentHand: number;
  currentTrick: number;
  heartsBroken: boolean;
  tricks: Array<any>;
  scores: Record<number, number>;
}

export interface GameState {
  gameId: number;
  status: 'PLAYING' | 'FINISHED' | 'PAUSED' | 'ABANDONED';
  players: PlayerInfo[];
  currentHand?: number;
  currentTrick?: number;
  currentTurn?: number; // プレイヤーID
  phase: 'waiting' | 'dealing' | 'exchanging' | 'playing' | 'completed';
  heartsBroken: boolean;
  tricks: TrickData[];
  scores: Record<number, number>; // プレイヤーID -> 累積スコア
  currentHandScores?: Record<number, number>; // プレイヤーID -> 現在ハンドの獲得点数
  handCards?: Record<number, CardInfo[]>; // プレイヤーID -> 手札（現在のプレイヤーのみ）
}

export interface HandData {
  handNumber: number;
  initialCards: Record<number, CardInfo[]>; // プレイヤーID -> 初期手札
  exchangeDirection: 'left' | 'right' | 'across' | 'none';
}

export interface CardPlayData {
  playerId: number;
  cardId: number;
  trickNumber: number;
  playOrder: number;
}

export interface TrickData {
  trickNumber: number;
  cards: CardPlayData[];
  winnerId?: number;
  points: number;
  leadPlayerId: number;
}

export interface TrickResult {
  trickNumber: number;
  winnerId: number;
  points: number;
  cards: CardPlayData[];
}

export interface HandResult {
  handNumber: number;
  scores: Record<number, number>; // プレイヤーID -> このハンドのスコア
  cumulativeScores: Record<number, number>; // プレイヤーID -> 累積スコア
  shootTheMoonPlayerId?: number;
}

export interface GameResult {
  gameId: number;
  winnerId: number;
  finalScores: Record<number, number>;
  duration: number; // 分単位
}

// エラー関連の型定義
export interface GameError {
  code: string;
  message: string;
  details?: any;
}

// ユーティリティ型
export type PlayerPosition = 'North' | 'East' | 'South' | 'West';

export interface PlayerPositionMap {
  [playerId: number]: PlayerPosition;
}
