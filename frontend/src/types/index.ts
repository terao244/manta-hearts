// バックエンドと共有する型定義
export interface PlayerInfo {
  id: number;
  name: string;
  displayName: string;
  displayOrder: number;
  isActive: boolean;
  position?: PlayerPosition;
}

export interface CardInfo {
  id: number;
  suit: 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';
  rank: 'ACE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN' | 'EIGHT' | 'NINE' | 'TEN' | 'JACK' | 'QUEEN' | 'KING';
  code: string;
  pointValue: number;
  sortOrder: number;
}

// Socket.io関連の型定義
export interface ServerToClientEvents {
  gameState: (gameState: GameState) => void;
  gameStateChanged: (gameStateUpdate: GameStateUpdate) => void;
  playerJoined: (playerInfo: PlayerInfo) => void;
  playerLeft: (playerId: number) => void;
  gameStarted: (gameId: number) => void;
  handStarted: (handData: HandData) => void;
  cardsDealt: (cards: CardInfo[]) => void;
  handUpdated: (cards: CardInfo[]) => void;
  exchangePhaseStarted: (direction: 'left' | 'right' | 'across' | 'none') => void;
  exchangeProgress: (progress: { exchangedPlayers: number[]; remainingPlayers: number[] }) => void;
  playingPhaseStarted: (leadPlayerId: number) => void;
  cardPlayed: (playData: CardPlayData) => void;
  trickCompleted: (trickResult: TrickResult) => void;
  handScoreUpdate: (currentHandScores: Record<number, number>) => void;
  handCompleted: (handResult: HandResult) => void;
  scoreHistoryUpdate: (scoreHistory: ScoreHistoryEntry[]) => void;
  gameCompleted: (gameResult: GameResult) => void;
  error: (error: string) => void;
  connectionStatus: (status: 'connected' | 'disconnected' | 'reconnected') => void;
  ping: () => void;
}

export interface ClientToServerEvents {
  login: (playerId: number, callback: (success: boolean, playerInfo?: PlayerInfo) => void) => void;
  joinGame: (playerId: number, callback: (success: boolean, gameInfo?: GameInfo) => void) => void;
  playCard: (cardId: number, callback: (success: boolean, error?: string) => void) => void;
  exchangeCards: (cardIds: number[], callback: (success: boolean, error?: string) => void) => void;
  getValidCards: (callback: (validCardIds: number[]) => void) => void;
  disconnect: () => void;
  reconnect: () => void;
  pong: () => void;
}

// ゲーム情報の型定義 (バックエンドから取得)
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
  tricks: TrickData[];
  scores: Record<number, number>;
  scoreHistory: ScoreHistoryEntry[];
  hand?: CardInfo[];
}

// ゲーム状態関連の型定義
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

export interface GameStateUpdate {
  gameId: number;
  status: string;
  players: PlayerInfo[];
  phase: string;
  currentTurn?: number;
  heartsBroken: boolean;
  tricks: TrickData[];
  scores: Record<number, number>;
}

export interface HandData {
  handNumber: number;
  initialCards: Record<number, CardInfo[]>; // プレイヤーID -> 初期手札
  exchangeDirection: 'left' | 'right' | 'across' | 'none';
}

export interface CardPlayData {
  playerId: number;
  card: CardInfo;
}

export interface TrickData {
  trickNumber: number;
  cards: CardPlayData[];
  winnerId?: number | null;
  points: number;
  isCompleted: boolean;
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
  winnerId: number;
  finalScores: Record<number, number>;
  rankings: Array<{ playerId: number; rank: number; score: number }>;
  scoreHistory: Array<{ hand: number; scores: Record<number, number> }>;
}

// フロントエンド固有の型定義
export interface LoginState {
  isLoggedIn: boolean;
  playerInfo?: PlayerInfo;
  isLoading: boolean;
  error?: string;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  reconnectAttempts: number;
}

export interface UIState {
  selectedCards: CardInfo[];
  hoveredCard?: CardInfo;
  showScores: boolean;
  showHistory: boolean;
}

// ユーティリティ型
export type PlayerPosition = 'North' | 'East' | 'South' | 'West';

export interface PlayerPositionMap {
  [playerId: number]: PlayerPosition;
}

// フロントエンド画面表示用の相対位置型
export type RelativePosition = 'top' | 'bottom' | 'left' | 'right';

// コンポーネントProps型
export interface PlayerSelectProps {
  onPlayerSelect: (playerId: number) => void;
  isLoading: boolean;
  error?: string;
}

export interface GameBoardProps {
  gameState: GameState;
  currentPlayerId?: number;
  validCardIds?: number[];
  exchangeDirection?: 'left' | 'right' | 'across' | 'none';
  exchangeProgress?: { exchangedPlayers: number[]; remainingPlayers: number[] };
  scoreHistory?: ScoreHistoryEntry[];
  showScoreGraph?: boolean;
  gameResult?: GameResult;
  isGameCompleted?: boolean;
  isTrickCompleted?: boolean;
  currentTrickResult?: TrickResult;
  onCardPlay: (cardId: number) => void;
  onCardExchange: (cardIds: number[]) => void;
  onCloseGameEndModal?: () => void;
}

export interface CardProps {
  card: CardInfo;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export interface ScoreDisplayProps {
  scores: Record<number, number>;
  players: PlayerInfo[];
  winner?: number;
}

// スコアグラフ関連の型定義
export interface ScoreHistoryEntry {
  hand: number;
  scores: Record<number, number>;
}

export interface ScoreGraphProps {
  players: PlayerInfo[];
  scoreHistory: ScoreHistoryEntry[];
  currentPlayerId?: number;
  className?: string;
  height?: string | number;
}

// ゲーム履歴API関連の型定義
export interface GameData {
  id: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'PLAYING' | 'FINISHED' | 'PAUSED' | 'ABANDONED';
  finalScores: Array<{
    playerId: number;
    playerName: string;
    score: number;
  }>;
  winnerId?: number;
  winnerName?: string;
  playerCount?: number;
  players: Array<{
    id: number;
    name: string;
    position: 'North' | 'East' | 'South' | 'West';
    finalScore: number;
  }>;
}

export interface GameDetailData extends GameData {
  hands: HandDetailData[];
  scoreHistory: ScoreHistoryEntry[];
}

export interface HandDetailData {
  id: number;
  handNumber: number;
  exchangeDirection: 'left' | 'right' | 'across' | 'none';
  heartsBroken: boolean;
  shootTheMoonPlayerId?: number;
  shootTheMoonPlayerName?: string;
  scores: Record<number, number>;
  tricks: TrickDetailData[];
}

export interface TrickDetailData {
  id: number;
  trickNumber: number;
  handNumber: number;
  leadPlayerId: number;
  winnerId: number;
  points: number;
  cards: Array<{
    playerId: number;
    card: CardInfo;
  }>;
}

export interface GameListQuery {
  page?: number;
  limit?: number;
  status?: 'PLAYING' | 'FINISHED' | 'PAUSED' | 'ABANDONED';
  playerId?: number;
  sortBy?: 'startTime' | 'endTime' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface GameListResponse {
  success: boolean;
  data: GameData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GameDetailResponse {
  success: boolean;
  data: GameDetailData;
}

// カスタムフック用の型定義
export interface UseGameHistoryOptions {
  page?: number;
  limit?: number;
  status?: string;
  playerId?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface UseGameHistoryResult {
  games: GameData[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  refetch: () => void;
}

export interface UseGameDetailResult {
  game: GameDetailData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// カード表記システム関連の型定義
export interface CardDisplay {
  suit: string;
  rank: string;
  displayText: string;
  color: 'red' | 'black';
}

export interface CardFormattingOptions {
  format?: 'full' | 'short' | 'compact';
  showColor?: boolean;
  separator?: string;
}