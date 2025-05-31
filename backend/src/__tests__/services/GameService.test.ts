import { GameService } from '../../services/GameService';
import { PrismaService } from '../../services/PrismaService';
import { GameEngine } from '../../game/GameEngine';
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
});