import {
  GameData,
  GameDetailData,
  GameListQuery,
  GameListResponse,
  GameDetailResponse,
  CardInfo,
} from '../../types';

// API Base URL - 環境変数から取得、デフォルトはlocalhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * HTTP Request 共通関数
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

/**
 * クエリパラメータを URLSearchParams に変換
 */
function buildQueryParams(query: GameListQuery): URLSearchParams {
  const params = new URLSearchParams();
  
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.status) params.append('status', query.status);
  if (query.playerId) params.append('playerId', query.playerId.toString());
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (query.sortOrder) params.append('sortOrder', query.sortOrder);
  
  return params;
}

/**
 * ゲーム一覧を取得
 */
export async function fetchGames(
  query: GameListQuery = {}
): Promise<{ games: GameData[]; pagination: GameListResponse['pagination'] }> {
  const params = buildQueryParams(query);
  const endpoint = `/api/games?${params.toString()}`;
  
  const response = await request<GameListResponse>(endpoint);
  
  if (!response.success) {
    throw new Error('Failed to fetch games');
  }
  
  return {
    games: response.data,
    pagination: response.pagination,
  };
}

/**
 * 特定のゲーム詳細を取得
 */
export async function fetchGameById(gameId: number): Promise<GameDetailData> {
  const endpoint = `/api/games/${gameId}`;
  
  const response = await request<GameDetailResponse>(endpoint);
  
  if (!response.success) {
    throw new Error(`Failed to fetch game ${gameId}`);
  }
  
  return response.data;
}

/**
 * APIエラーハンドリング用のユーティリティ
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * リトライ機能付きのFetch関数
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      
      // 最後の試行の場合はエラーを投げる
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // 指数バックオフで待機
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError!;
}

/**
 * リトライ付きゲーム一覧取得
 */
export async function fetchGamesWithRetry(
  query: GameListQuery = {}
): Promise<{ games: GameData[]; pagination: GameListResponse['pagination'] }> {
  return fetchWithRetry(() => fetchGames(query));
}

/**
 * リトライ付きゲーム詳細取得
 */
export async function fetchGameByIdWithRetry(gameId: number): Promise<GameDetailData> {
  return fetchWithRetry(() => fetchGameById(gameId));
}

// ハンド履歴関連の型定義
export interface HandCardsResponse {
  success: boolean;
  data: {
    handId: number;
    playerCards: Record<number, CardInfo[]>;
  };
}

export interface CardExchange {
  id: number;
  fromPlayer: {
    id: number;
    name: string;
  };
  toPlayer: {
    id: number;
    name: string;
  };
  card: CardInfo;
  exchangeOrder: number;
}

export interface HandExchangesResponse {
  success: boolean;
  data: {
    handId: number;
    exchanges: CardExchange[];
  };
}

/**
 * 特定ハンドの全プレイヤー手札を取得
 */
export async function fetchHandCards(gameId: number, handId: number): Promise<HandCardsResponse['data']> {
  const endpoint = `/api/games/${gameId}/hands/${handId}/cards`;
  
  const response = await request<HandCardsResponse>(endpoint);
  
  if (!response.success) {
    throw new Error(`Failed to fetch hand cards for game ${gameId} hand ${handId}`);
  }
  
  return response.data;
}

/**
 * 特定ハンドのカード交換履歴を取得
 */
export async function fetchHandExchanges(gameId: number, handId: number): Promise<HandExchangesResponse['data']> {
  const endpoint = `/api/games/${gameId}/hands/${handId}/exchanges`;
  
  const response = await request<HandExchangesResponse>(endpoint);
  
  if (!response.success) {
    throw new Error(`Failed to fetch hand exchanges for game ${gameId} hand ${handId}`);
  }
  
  return response.data;
}

/**
 * リトライ付きハンドカード取得
 */
export async function fetchHandCardsWithRetry(gameId: number, handId: number): Promise<HandCardsResponse['data']> {
  return fetchWithRetry(() => fetchHandCards(gameId, handId));
}

/**
 * リトライ付きハンド交換履歴取得
 */
export async function fetchHandExchangesWithRetry(gameId: number, handId: number): Promise<HandExchangesResponse['data']> {
  return fetchWithRetry(() => fetchHandExchanges(gameId, handId));
}