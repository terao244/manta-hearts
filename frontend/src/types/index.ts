// バックエンドと共有する型定義
export interface PlayerInfo {
  id: number;
  name: string;
  displayName: string;
  displayOrder: number;
  isActive: boolean;
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
  playerJoined: (playerInfo: PlayerInfo) => void;
  playerLeft: (playerId: number) => void;
  gameStarted: (gameId: number) => void;
  handStarted: (handData: HandData) => void;
  cardPlayed: (playData: CardPlayData) => void;
  trickCompleted: (trickResult: TrickResult) => void;
  handCompleted: (handResult: HandResult) => void;
  gameCompleted: (gameResult: GameResult) => void;
  error: (error: string) => void;
  connectionStatus: (status: 'connected' | 'disconnected' | 'reconnected') => void;
}

export interface ClientToServerEvents {
  login: (playerName: string, callback: (success: boolean, playerInfo?: PlayerInfo) => void) => void;
  joinGame: (callback: (success: boolean, gameState?: GameState) => void) => void;
  playCard: (cardId: number, callback: (success: boolean, error?: string) => void) => void;
  exchangeCards: (cardIds: number[], callback: (success: boolean, error?: string) => void) => void;
  disconnect: () => void;
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

// コンポーネントProps型
export interface PlayerSelectProps {
  onPlayerSelect: (playerName: string) => void;
  isLoading: boolean;
  error?: string;
}

export interface GameBoardProps {
  gameState: GameState;
  currentPlayerId?: number;
  onCardPlay: (cardId: number) => void;
  onCardExchange: (cardIds: number[]) => void;
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