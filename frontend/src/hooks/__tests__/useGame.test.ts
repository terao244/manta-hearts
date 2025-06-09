import { renderHook, act } from '@testing-library/react';
import { useGame } from '../useGame';
import type { PlayerInfo, GameResult } from '@/types';

// useSocketのモック
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

const mockJoinGame = jest.fn();
const mockPlayCard = jest.fn();
const mockExchangeCards = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('../useSocket', () => ({
  useSocket: () => ({
    socket: mockSocket,
    joinGame: mockJoinGame,
    playCard: mockPlayCard,
    exchangeCards: mockExchangeCards,
    on: mockOn,
    off: mockOff
  })
}));

describe('useGame - Tie Game Continuation', () => {
  const mockPlayer: PlayerInfo = {
    id: 1,
    name: 'Player1',
    displayName: 'プレイヤー1',
    displayOrder: 1,
    isActive: true
  };

  const mockGameState = {
    gameId: 1,
    status: 'PLAYING',
    players: [],
    currentHand: 1,
    currentTrick: 1,
    currentTurn: 1,
    phase: 'playing',
    heartsBroken: false,
    tricks: [],
    scores: {},
    handCards: {}
  };

  const setupGameInProgress = () => {
    // ゲームに参加させる（gameStateイベントでisInGameをtrueにする）
    const gameStateHandler = mockOn.mock.calls.find(
      call => call[0] === 'gameState'
    )?.[1];
    
    act(() => {
      gameStateHandler(mockGameState);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGameCompleted - 同点継続テスト', () => {
    it('同点時にゲーム終了モーダルを表示しない', () => {
      const { result } = renderHook(() => useGame(mockPlayer));
      setupGameInProgress(result);
      
      // gameCompletedイベントハンドラーを取得
      const gameCompletedHandler = mockOn.mock.calls.find(
        call => call[0] === 'gameCompleted'
      )?.[1];
      
      expect(gameCompletedHandler).toBeDefined();
      
      // 同点継続のGameResult（winnerId=null）
      const tiedGameResult: GameResult = {
        gameId: 1,
        finalScores: { 1: 100, 2: 85, 3: 85, 4: 95 }, // 2人同点
        winnerId: null, // 同点時はnull
        completedAt: new Date().toISOString(),
        scoreHistory: []
      };
      
      act(() => {
        gameCompletedHandler(tiedGameResult);
      });
      
      // 同点時はゲーム終了モーダルを表示しない
      expect(result.current.isGameCompleted).toBe(false);
      expect(result.current.gameResult).toBeUndefined();
      
      // ゲームには参加したまま（継続）
      expect(result.current.isInGame).toBe(true);
    });

    it('3人同点時にゲーム終了モーダルを表示しない', () => {
      const { result } = renderHook(() => useGame(mockPlayer));
      setupGameInProgress(result);
      
      const gameCompletedHandler = mockOn.mock.calls.find(
        call => call[0] === 'gameCompleted'
      )?.[1];
      
      // 3人同点のGameResult
      const tiedGameResult: GameResult = {
        gameId: 1,
        finalScores: { 1: 100, 2: 85, 3: 85, 4: 85 }, // 3人同点
        winnerId: null,
        completedAt: new Date().toISOString(),
        scoreHistory: []
      };
      
      act(() => {
        gameCompletedHandler(tiedGameResult);
      });
      
      expect(result.current.isGameCompleted).toBe(false);
      expect(result.current.gameResult).toBeUndefined();
      expect(result.current.isInGame).toBe(true);
    });

    it('4人同点時にゲーム終了モーダルを表示しない', () => {
      const { result } = renderHook(() => useGame(mockPlayer));
      setupGameInProgress(result);
      
      const gameCompletedHandler = mockOn.mock.calls.find(
        call => call[0] === 'gameCompleted'
      )?.[1];
      
      // 4人同点のGameResult
      const tiedGameResult: GameResult = {
        gameId: 1,
        finalScores: { 1: 85, 2: 85, 3: 85, 4: 85 }, // 4人同点
        winnerId: null,
        completedAt: new Date().toISOString(),
        scoreHistory: []
      };
      
      act(() => {
        gameCompletedHandler(tiedGameResult);
      });
      
      expect(result.current.isGameCompleted).toBe(false);
      expect(result.current.gameResult).toBeUndefined();
      expect(result.current.isInGame).toBe(true);
    });

    it('勝者確定時にゲーム終了モーダルを表示する', () => {
      const { result } = renderHook(() => useGame(mockPlayer));
      setupGameInProgress(result);
      
      const gameCompletedHandler = mockOn.mock.calls.find(
        call => call[0] === 'gameCompleted'
      )?.[1];
      
      // 勝者確定のGameResult
      const winnerGameResult: GameResult = {
        gameId: 1,
        finalScores: { 1: 100, 2: 85, 3: 95, 4: 110 },
        winnerId: 2, // プレイヤー2が勝者
        completedAt: new Date().toISOString(),
        scoreHistory: []
      };
      
      act(() => {
        gameCompletedHandler(winnerGameResult);
      });
      
      // 勝者確定時は従来通りゲーム終了モーダルを表示
      expect(result.current.isGameCompleted).toBe(true);
      expect(result.current.gameResult).toEqual(winnerGameResult);
      expect(result.current.isInGame).toBe(true);
    });

    it('同点継続の状態管理が正しく動作する', () => {
      const { result } = renderHook(() => useGame(mockPlayer));
      setupGameInProgress(result);
      
      const gameCompletedHandler = mockOn.mock.calls.find(
        call => call[0] === 'gameCompleted'
      )?.[1];
      
      // まず同点継続
      const tiedGameResult: GameResult = {
        gameId: 1,
        finalScores: { 1: 100, 2: 85, 3: 85, 4: 95 },
        winnerId: null,
        completedAt: new Date().toISOString(),
        scoreHistory: []
      };
      
      act(() => {
        gameCompletedHandler(tiedGameResult);
      });
      
      expect(result.current.isGameCompleted).toBe(false);
      expect(result.current.isInGame).toBe(true);
      
      // その後勝者確定
      const winnerGameResult: GameResult = {
        gameId: 1,
        finalScores: { 1: 105, 2: 85, 3: 90, 4: 95 },
        winnerId: 2,
        completedAt: new Date().toISOString(),
        scoreHistory: []
      };
      
      act(() => {
        gameCompletedHandler(winnerGameResult);
      });
      
      expect(result.current.isGameCompleted).toBe(true);
      expect(result.current.gameResult).toEqual(winnerGameResult);
    });
  });

  describe('同点継続時のUI制御', () => {
    it('同点継続時にも既存の状態管理が正常に動作する', () => {
      const { result } = renderHook(() => useGame(mockPlayer));
      
      // 初期状態確認
      expect(result.current.isGameCompleted).toBe(false);
      expect(result.current.gameResult).toBeUndefined();
      expect(result.current.isInGame).toBe(false);
      
      // ゲームに参加
      setupGameInProgress(result);
      expect(result.current.isInGame).toBe(true);
      
      // 同点継続後も基本的な状態は維持される
      const gameCompletedHandler = mockOn.mock.calls.find(
        call => call[0] === 'gameCompleted'
      )?.[1];
      
      const tiedGameResult: GameResult = {
        gameId: 1,
        finalScores: { 1: 100, 2: 85, 3: 85, 4: 95 },
        winnerId: null,
        completedAt: new Date().toISOString(),
        scoreHistory: []
      };
      
      act(() => {
        gameCompletedHandler(tiedGameResult);
      });
      
      // 同点継続時はゲーム状態を維持
      expect(result.current.error).toBeNull();
      expect(result.current.isInGame).toBe(true);
    });
  });
});