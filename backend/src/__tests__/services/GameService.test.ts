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
    };

    mockPrismaService = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
    } as any;

    (PrismaService.getInstance as jest.Mock).mockReturnValue(mockPrismaService);

    // Socket.IOのモック設定
    mockSocketIO = {
      sockets: {
        sockets: new Map(),
      },
    } as any;

    // GameServiceのインスタンスを取得
    gameService = GameService.getInstance();
    gameService.setSocketIO(mockSocketIO);

    // GameEngineのモック設定
    (GameEngine as jest.MockedClass<typeof GameEngine>).mockImplementation(() => ({
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
      }),
      getPlayerHand: jest.fn().mockReturnValue([]),
      getScore: jest.fn().mockReturnValue(0),
      startGame: jest.fn(),
      playCard: jest.fn().mockReturnValue(true),
      exchangeCards: jest.fn().mockReturnValue(true),
      removePlayer: jest.fn().mockReturnValue(true),
    } as any));
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
});