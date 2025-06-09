import { GameService } from '../../services/GameService';
import { PrismaService } from '../../services/PrismaService';
import { GameEngine } from '../../game/GameEngine';
import { GameStatus } from '../../game/GameState';
import { Server } from 'socket.io';

// Prismaのモック
jest.mock('../../services/PrismaService');
jest.mock('../../game/GameEngine');

describe('GameService', () => {
  let gameService: GameService;
  let mockPrismaService: jest.Mocked<PrismaService>;
  let mockPrismaClient: any;
  let mockSocketIO: jest.Mocked<Server>;
  let mockGameEngine: any;
  let mockSocketEmit: jest.Mock;

  beforeEach(() => {
    // consoleのモック設定
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // PrismaServiceのモック設定
    mockPrismaClient = {
      player: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      game: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      gameSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };

    mockPrismaService = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
    } as any;

    (PrismaService.getInstance as jest.Mock).mockReturnValue(mockPrismaService);

    // Socket.IOのモック設定
    mockSocketEmit = jest.fn();
    const mockSocket = {
      id: 'socket_1',
      data: { playerId: 1 },
      emit: mockSocketEmit
    };

    mockSocketIO = {
      sockets: {
        sockets: new Map([['socket_1', mockSocket]]),
      },
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    // GameServiceのインスタンスを取得
    gameService = GameService.getInstance();
    gameService.setSocketIO(mockSocketIO);

    // GameEngineのモック設定
    mockGameEngine = {
      addPlayer: jest.fn().mockReturnValue(true),
      getGameState: jest.fn().mockReturnValue({
        isFull: jest.fn().mockReturnValue(false),
        status: 'waiting',
        phase: 'waiting',
        currentTurn: undefined,
        heartsBroken: false,
        tricks: [],
        cumulativeScores: new Map(),
        getAllPlayers: jest.fn().mockReturnValue([]),
        getPlayer: jest.fn().mockReturnValue({
          id: 1,
          position: 'North',
        }),
        getFinalRankings: jest.fn().mockReturnValue([
          { playerId: 2, rank: 1, score: 85 },
          { playerId: 3, rank: 2, score: 90 },
          { playerId: 4, rank: 3, score: 95 },
          { playerId: 1, rank: 4, score: 105 }
        ]),
        startedAt: new Date('2025-01-01T00:00:00Z'),
      }),
      getPlayerHand: jest.fn().mockReturnValue([]),
      getScore: jest.fn().mockReturnValue(0),
      startGame: jest.fn(),
      playCard: jest.fn().mockReturnValue(true),
      exchangeCards: jest.fn().mockReturnValue(true),
      removePlayer: jest.fn().mockReturnValue(true),
      on: jest.fn(),
      off: jest.fn(),
    };

    (GameEngine as jest.MockedClass<typeof GameEngine>).mockImplementation(() => mockGameEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // シングルトンインスタンスをリセット
    (GameService as any).instance = undefined;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = GameService.getInstance();
      const instance2 = GameService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('joinGame', () => {
    it('should successfully join a game', async () => {
      // Arrange
      const playerId = 1;
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: 123 });

      // Act
      const result = await gameService.joinGame(playerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.gameInfo).toBeDefined();
      expect(mockPrismaClient.player.findUnique).toHaveBeenCalledWith({
        where: { id: playerId },
      });
    });

    it('should fail if player not found', async () => {
      // Arrange
      const playerId = 999;
      mockPrismaClient.player.findUnique.mockResolvedValue(null);

      // Act
      const result = await gameService.joinGame(playerId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.gameInfo).toBeUndefined();
    });

    it('should fail if player is inactive', async () => {
      // Arrange
      const playerId = 1;
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: false,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: 123 });

      // Act
      const result = await gameService.joinGame(playerId);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should save game session with player position', async () => {
      // Arrange
      const playerId = 1;
      const playerData = {
        id: playerId,
        name: 'North',
        displayName: '北',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: 123 });

      // Mock the assignPlayerPosition method to return NORTH
      const gameService = GameService.getInstance();
      jest.spyOn(gameService as any, 'assignPlayerPosition').mockReturnValue('NORTH');

      // Act
      const result = await gameService.joinGame(playerId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockPrismaClient.gameSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gameId: 123,
          playerId: playerId,
          status: 'CONNECTED',
          playerPosition: 'NORTH',
        }),
      });
    });
  });

  describe('playCard', () => {
    it('should successfully play a card', async () => {
      // Arrange
      const playerId = 1;
      const cardId = 1;
      const gameId = 123;

      // プレイヤーをゲームに参加させる
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      await gameService.joinGame(playerId);

      // Act
      const result = await gameService.playCard(playerId, cardId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail if player not in game', async () => {
      // Arrange
      const playerId = 999;
      const cardId = 1;

      // Act
      const result = await gameService.playCard(playerId, cardId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not in game');
    });
  });

  describe('exchangeCards', () => {
    it('should successfully exchange cards', async () => {
      // Arrange
      const playerId = 1;
      const cardIds = [1, 2, 3];
      const gameId = 123;

      // プレイヤーをゲームに参加させる
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      await gameService.joinGame(playerId);

      // Act
      const result = await gameService.exchangeCards(playerId, cardIds);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail if not exactly 3 cards', async () => {
      // Arrange
      const playerId = 1;
      const cardIds = [1, 2]; // Only 2 cards

      // Act
      const result = await gameService.exchangeCards(playerId, cardIds);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Must exchange exactly 3 cards');
    });

    it('should fail if player not in game', async () => {
      // Arrange
      const playerId = 999;
      const cardIds = [1, 2, 3];

      // Act
      const result = await gameService.exchangeCards(playerId, cardIds);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not in game');
    });
  });

  describe('removePlayer', () => {
    it('should successfully remove a player', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;

      // プレイヤーをゲームに参加させる
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      await gameService.joinGame(playerId);

      // Act
      const result = gameService.removePlayer(playerId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if player not in game', () => {
      // Arrange
      const playerId = 999;

      // Act
      const result = gameService.removePlayer(playerId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getGameInfo', () => {
    it('should return game info for existing game', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;

      // プレイヤーをゲームに参加させる
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      await gameService.joinGame(playerId);

      // Act
      const gameInfo = gameService.getGameInfo(gameId, playerId);

      // Assert
      expect(gameInfo).toBeDefined();
      expect(gameInfo?.gameId).toBe(gameId);
      expect(gameInfo?.hand).toBeDefined();
    });

    it('should return null for non-existing game', () => {
      // Arrange
      const gameId = 999;

      // Act
      const gameInfo = gameService.getGameInfo(gameId);

      // Assert
      expect(gameInfo).toBeNull();
    });
  });

  describe('getActiveGames', () => {
    it('should return list of active game IDs', async () => {
      // Arrange
      const playerId = 1;
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: 123 });

      await gameService.joinGame(playerId);

      // Act
      const activeGames = gameService.getActiveGames();

      // Assert
      expect(activeGames).toContain(123);
    });
  });

  describe('game resume functionality', () => {
    let mockGameEngine: any;
    let mockGameState: any;

    beforeEach(() => {
      // 高度なGameEngineモック設定
      mockGameState = {
        isFull: jest.fn().mockReturnValue(false),
        status: 'waiting',
        phase: 'waiting',
        currentTurn: undefined,
        heartsBroken: false,
        tricks: [],
        cumulativeScores: new Map(),
        getAllPlayers: jest.fn().mockReturnValue([]),
        getPlayer: jest.fn(),
        getFinalRankings: jest.fn().mockReturnValue([
          { playerId: 2, rank: 1, score: 85 },
          { playerId: 3, rank: 2, score: 90 },
          { playerId: 4, rank: 3, score: 95 },
          { playerId: 1, rank: 4, score: 105 }
        ]),
        startedAt: new Date('2025-01-01T00:00:00Z'),
      };

      mockGameEngine = {
        addPlayer: jest.fn().mockReturnValue(true),
        getGameState: jest.fn().mockReturnValue(mockGameState),
        getPlayerHand: jest.fn().mockReturnValue([]),
        getScore: jest.fn().mockReturnValue(0),
        startGame: jest.fn(),
        playCard: jest.fn().mockReturnValue(true),
        exchangeCards: jest.fn().mockReturnValue(true),
        removePlayer: jest.fn().mockReturnValue(true),
      };

      (GameEngine as jest.MockedClass<typeof GameEngine>).mockImplementation(() => mockGameEngine);
    });

    it('should allow player to rejoin existing active game', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      // プレイヤーを最初にゲームに参加させる
      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      // 既存プレイヤーオブジェクトを設定
      const existingPlayer = {
        id: playerId,
        name: 'TestPlayer',
        isConnected: false,
        lastActiveAt: new Date(),
      };
      mockGameState.getPlayer.mockReturnValue(existingPlayer);
      mockGameState.status = 'playing';

      // 最初の参加
      await gameService.joinGame(playerId);

      // ゲーム状態を進行中に変更
      mockGameState.status = 'playing';

      // Act - 2回目の参加（復帰）
      const result = await gameService.joinGame(playerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.gameInfo).toBeDefined();
      expect(existingPlayer.isConnected).toBe(true);
      expect(mockGameEngine.addPlayer).toHaveBeenCalledTimes(1); // 2回目は呼ばれない
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('rejoining existing game'));
    });

    it('should start new game when rejoining completed game', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;
      const newGameId = 456;
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create
        .mockResolvedValueOnce({ id: gameId })
        .mockResolvedValueOnce({ id: newGameId });

      // 最初の参加
      await gameService.joinGame(playerId);

      // ゲームを完了状態に変更
      mockGameState.status = GameStatus.FINISHED;

      // Act - 2回目の参加（新しいゲーム）
      const result = await gameService.joinGame(playerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.gameInfo).toBeDefined();
      expect(mockGameEngine.addPlayer).toHaveBeenCalledTimes(2); // 2回呼ばれる
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('leaving completed game'));
    });

    it('should handle rejoin when player not found in existing game', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      // 最初の参加
      await gameService.joinGame(playerId);

      // プレイヤーが存在しない状態に設定
      mockGameState.getPlayer.mockReturnValue(null);
      mockGameState.status = 'playing';

      // Act - 2回目の参加（復帰試行）
      const result = await gameService.joinGame(playerId);

      // Assert
      expect(result.success).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not found in existing game'));
    });

    it('should not start game automatically when rejoining', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      // 既存プレイヤーオブジェクトを設定
      const existingPlayer = {
        id: playerId,
        name: 'TestPlayer',
        isConnected: false,
        lastActiveAt: new Date(),
      };
      mockGameState.getPlayer.mockReturnValue(existingPlayer);
      mockGameState.status = 'playing';
      mockGameState.isFull.mockReturnValue(true); // 満員状態

      // 最初の参加
      await gameService.joinGame(playerId);

      // startGameをリセット
      mockGameEngine.startGame.mockClear();

      // Act - 2回目の参加（復帰）
      await gameService.joinGame(playerId);

      // Assert
      expect(mockGameEngine.startGame).not.toHaveBeenCalled(); // 復帰時は自動開始しない
    });
  });

  describe('同点継続機能テスト', () => {
    let gameCompletedHandler: any;

    beforeEach(() => {
      // GameEngineのコンストラクタから実際のイベントハンドラーをキャプチャ
      (GameEngine as jest.MockedClass<typeof GameEngine>).mockImplementation((gameId, eventListeners) => {
        gameCompletedHandler = eventListeners?.onGameCompleted;
        return mockGameEngine;
      });
    });

    it('同点時にゲーム継続イベントを正しく処理する', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;

      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      await gameService.joinGame(playerId);

      const tiedGameResult = {
        gameId: gameId,
        winnerId: null, // 同点時はnull
        finalScores: { 1: 100, 2: 85, 3: 85, 4: 95 },
        scoreHistory: [],
        completedAt: new Date().toISOString()
      };

      // Act
      await gameCompletedHandler(tiedGameResult.winnerId, new Map(Object.entries(tiedGameResult.finalScores)));

      // Assert - 同点時はゲーム継続メッセージを送信
      // setTimeoutを考慮して少し待つ
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockSocketEmit).toHaveBeenCalledWith(
        'gameContinuedFromTie',
        expect.objectContaining({
          message: '同点のため次のハンドに進みます',
          finalScores: tiedGameResult.finalScores
        })
      );
    });

    it('勝者確定時に正常なゲーム終了イベントを処理する', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;

      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      await gameService.joinGame(playerId);

      const winnerGameResult = {
        gameId: gameId,
        winnerId: 2, // 勝者確定
        finalScores: { 1: 100, 2: 85, 3: 95, 4: 110 },
        rankings: [
          { playerId: 2, rank: 1, score: 85 },
          { playerId: 3, rank: 2, score: 95 },
          { playerId: 1, rank: 3, score: 100 },
          { playerId: 4, rank: 4, score: 110 }
        ],
        scoreHistory: [],
        completedAt: new Date().toISOString()
      };

      // Act
      await gameCompletedHandler(winnerGameResult.winnerId, new Map(Object.entries(winnerGameResult.finalScores)));

      // Assert - 勝者確定時は通常のゲーム完了イベントを送信
      // setTimeoutを考慮して少し待つ
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockSocketEmit).toHaveBeenCalledWith('gameCompleted', expect.objectContaining({
        winnerId: winnerGameResult.winnerId,
        finalScores: winnerGameResult.finalScores
      }));
    });

    it('同点継続と勝者確定の状態遷移が正しく動作する', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;

      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      await gameService.joinGame(playerId);

      // Act 1 - 同点継続
      const tiedGameResult = {
        gameId: gameId,
        winnerId: null,
        finalScores: { 1: 100, 2: 85, 3: 85, 4: 95 },
        scoreHistory: [],
        completedAt: new Date().toISOString()
      };

      await gameCompletedHandler(tiedGameResult.winnerId, new Map(Object.entries(tiedGameResult.finalScores)));

      // Assert 1 - 同点継続イベント送信
      // setTimeoutを考慮して少し待つ
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockSocketEmit).toHaveBeenCalledWith(
        'gameContinuedFromTie',
        expect.objectContaining({
          message: '同点のため次のハンドに進みます'
        })
      );

      // Act 2 - その後勝者確定
      mockSocketEmit.mockClear(); // 前の呼び出しをクリア
      
      const winnerGameResult = {
        gameId: gameId,
        winnerId: 2,
        finalScores: { 1: 105, 2: 85, 3: 90, 4: 95 },
        rankings: [
          { playerId: 2, rank: 1, score: 85 },
          { playerId: 3, rank: 2, score: 90 },
          { playerId: 4, rank: 3, score: 95 },
          { playerId: 1, rank: 4, score: 105 }
        ],
        scoreHistory: [],
        completedAt: new Date().toISOString()
      };

      await gameCompletedHandler(winnerGameResult.winnerId, new Map(Object.entries(winnerGameResult.finalScores)));

      // setTimeoutを考慮して少し待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert 2 - 勝者確定時の正常なゲーム完了イベント送信
      expect(mockSocketEmit).toHaveBeenCalledWith('gameCompleted', expect.objectContaining({
        winnerId: winnerGameResult.winnerId,
        finalScores: winnerGameResult.finalScores
      }));
    });

    it('同点継続時にSocket.io通信エラーが適切にハンドリングされる', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;

      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      await gameService.joinGame(playerId);

      // Socket.ioエラーをシミュレート
      mockSocketEmit.mockImplementation(() => {
        throw new Error('Socket.io connection error');
      });

      const tiedGameResult = {
        gameId: gameId,
        winnerId: null,
        finalScores: { 1: 100, 2: 85, 3: 85, 4: 95 },
        scoreHistory: [],
        completedAt: new Date().toISOString()
      };

      // Act & Assert - エラーが適切にキャッチされること
      await expect(gameCompletedHandler(tiedGameResult.winnerId, new Map(Object.entries(tiedGameResult.finalScores)))).resolves.not.toThrow();
      
      // setTimeoutを考慮して少し待つ
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // エラーログが出力されることを確認
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error handling tie continuation'),
        expect.any(Error)
      );
    });
  });

  describe('gameStateChanged event', () => {
    it('should include currentHand and currentTrick in gameStateChanged event', async () => {
      // Arrange
      const playerId = 1;
      const gameId = 123;
      const playerData = {
        id: playerId,
        name: 'TestPlayer',
        displayName: 'Test Player',
        isActive: true,
      };

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.game.create.mockResolvedValue({ id: gameId });

      // GameEngineのモックを更新してcurrentHandとcurrentTrickを含める
      const mockGameState = {
        isFull: jest.fn().mockReturnValue(false),
        status: 'PLAYING',
        phase: 'playing',
        currentHand: 2,
        currentTrick: 5,
        currentTurn: 1,
        heartsBroken: true,
        tricks: [],
        cumulativeScores: new Map([[1, 10], [2, 15]]),
        getAllPlayers: jest.fn().mockReturnValue([
          { id: 1, name: 'Player 1', displayName: 'Player 1', position: 'North' },
          { id: 2, name: 'Player 2', displayName: 'Player 2', position: 'East' }
        ]),
        getPlayer: jest.fn(),
        getFinalRankings: jest.fn().mockReturnValue([]),
        startedAt: new Date('2025-01-01T00:00:00Z'),
      };

      mockGameEngine.getGameState.mockReturnValue(mockGameState);

      // ゲームに参加
      await gameService.joinGame(playerId);

      // broadcastToGameメソッドをスパイ
      const broadcastToGameSpy = jest.spyOn(gameService as any, 'broadcastToGame');

      // GameEngineのコンストラクタから渡されたeventListenersを取得
      const gameEngineConstructorCall = (GameEngine as jest.MockedClass<typeof GameEngine>).mock.calls[0];
      const eventListeners = gameEngineConstructorCall[1];

      // Act - onGameStateChangedコールバックを直接呼び出す
      if (eventListeners && eventListeners.onGameStateChanged) {
        eventListeners.onGameStateChanged(mockGameState as any);
      }

      // Assert - broadcastToGameが適切なデータで呼ばれることを確認
      expect(broadcastToGameSpy).toHaveBeenCalledWith(gameId, 'gameStateChanged', expect.objectContaining({
        gameId,
        status: 'PLAYING',
        phase: 'playing',
        currentHand: 2,
        currentTrick: 5,
        currentTurn: 1,
        heartsBroken: true,
        tricks: [],
        scores: { 1: 10, 2: 15 },
        players: expect.arrayContaining([
          expect.objectContaining({ id: 1, position: 'North' }),
          expect.objectContaining({ id: 2, position: 'East' })
        ])
      }));
    });
  });
});