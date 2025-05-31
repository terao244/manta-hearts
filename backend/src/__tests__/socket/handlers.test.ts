import { SocketHandlers } from '../../socket/handlers';
import { GameService } from '../../services/GameService';
import { PrismaService } from '../../services/PrismaService';
import { Socket } from 'socket.io';

// サービスのモック
jest.mock('../../services/GameService');
jest.mock('../../services/PrismaService');

describe('SocketHandlers', () => {
  let socketHandlers: SocketHandlers;
  let mockSocket: jest.Mocked<Socket>;
  let mockGameService: jest.Mocked<GameService>;
  let mockPrismaClient: any;

  beforeEach(() => {
    // setIntervalとclearIntervalをモック化
    jest.spyOn(global, 'setInterval').mockImplementation(() => 1 as any);
    jest.spyOn(global, 'clearInterval').mockImplementation(() => {});

    // PrismaServiceのモック設定
    mockPrismaClient = {
      player: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockPrismaService = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
    };

    (PrismaService.getInstance as jest.Mock).mockReturnValue(mockPrismaService);

    // GameServiceのモック設定
    mockGameService = {
      joinGame: jest.fn(),
      playCard: jest.fn(),
      exchangeCards: jest.fn(),
      removePlayer: jest.fn(),
      io: undefined,
    } as any;

    (GameService.getInstance as jest.Mock).mockReturnValue(mockGameService);

    // Socketのモック設定
    mockSocket = {
      id: 'test-socket-id',
      data: {},
      on: jest.fn(),
      emit: jest.fn(),
      connected: true,
    } as any;

    socketHandlers = new SocketHandlers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('handleConnection', () => {
    it('should handle socket connection', () => {
      // Act
      socketHandlers.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('connectionStatus', 'connected');
      expect(mockSocket.on).toHaveBeenCalledWith('login', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('joinGame', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('playCard', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('exchangeCards', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('login handler', () => {
    let loginHandler: Function;

    beforeEach(() => {
      socketHandlers.handleConnection(mockSocket);
      // loginハンドラーを取得
      const loginCall = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'login'
      );
      loginHandler = loginCall[1];
    });

    it('should handle successful login', async () => {
      // Arrange
      const playerName = 'TestPlayer';
      const playerData = {
        id: 1,
        name: playerName,
        displayName: 'Test Player',
        displayOrder: 1,
        isActive: true,
      };
      const callback = jest.fn();

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);
      mockPrismaClient.player.update.mockResolvedValue(playerData);

      // Act
      await loginHandler(playerName, callback);

      // Assert
      expect(mockPrismaClient.player.findUnique).toHaveBeenCalledWith({
        where: { name: playerName },
      });
      expect(mockPrismaClient.player.update).toHaveBeenCalledWith({
        where: { id: playerData.id },
        data: { updatedAt: expect.any(Date) },
      });
      expect(mockSocket.data.playerId).toBe(playerData.id);
      expect(mockSocket.data.playerName).toBe(playerData.name);
      expect(callback).toHaveBeenCalledWith(true, {
        id: playerData.id,
        name: playerData.name,
        displayName: playerData.displayName,
        displayOrder: playerData.displayOrder,
        isActive: playerData.isActive,
      });
    });

    it('should handle login failure for non-existent player', async () => {
      // Arrange
      const playerName = 'NonExistentPlayer';
      const callback = jest.fn();

      mockPrismaClient.player.findUnique.mockResolvedValue(null);

      // Act
      await loginHandler(playerName, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(false);
      expect(mockSocket.data.playerId).toBeUndefined();
    });

    it('should handle login failure for inactive player', async () => {
      // Arrange
      const playerName = 'InactivePlayer';
      const playerData = {
        id: 1,
        name: playerName,
        displayName: 'Inactive Player',
        displayOrder: 1,
        isActive: false,
      };
      const callback = jest.fn();

      mockPrismaClient.player.findUnique.mockResolvedValue(playerData);

      // Act
      await loginHandler(playerName, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(false);
      expect(mockSocket.data.playerId).toBeUndefined();
    });
  });

  describe('joinGame handler', () => {
    let joinGameHandler: Function;

    beforeEach(() => {
      socketHandlers.handleConnection(mockSocket);
      // joinGameハンドラーを取得
      const joinGameCall = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'joinGame'
      );
      joinGameHandler = joinGameCall[1];
    });

    it('should handle successful game join', async () => {
      // Arrange
      const playerId = 1;
      const gameInfo = { 
        gameId: 123, 
        status: 'waiting', 
        players: [],
        phase: 'waiting',
        heartsBroken: false,
        tricks: [],
        scores: {}
      };
      const callback = jest.fn();

      mockSocket.data.playerId = playerId;
      mockGameService.joinGame.mockResolvedValue({
        success: true,
        gameInfo,
      });

      // Act
      await joinGameHandler(callback);

      // Assert
      expect(mockGameService.joinGame).toHaveBeenCalledWith(playerId);
      expect(callback).toHaveBeenCalledWith(true, gameInfo);
    });

    it('should handle game join failure when not logged in', async () => {
      // Arrange
      const callback = jest.fn();
      // playerId is not set

      // Act
      await joinGameHandler(callback);

      // Assert
      expect(mockGameService.joinGame).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('should handle game join failure from service', async () => {
      // Arrange
      const playerId = 1;
      const callback = jest.fn();

      mockSocket.data.playerId = playerId;
      mockGameService.joinGame.mockResolvedValue({
        success: false,
      });

      // Act
      await joinGameHandler(callback);

      // Assert
      expect(mockGameService.joinGame).toHaveBeenCalledWith(playerId);
      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  describe('playCard handler', () => {
    let playCardHandler: Function;

    beforeEach(() => {
      socketHandlers.handleConnection(mockSocket);
      // playCardハンドラーを取得
      const playCardCall = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'playCard'
      );
      playCardHandler = playCardCall[1];
    });

    it('should handle successful card play', async () => {
      // Arrange
      const playerId = 1;
      const cardId = 5;
      const callback = jest.fn();

      mockSocket.data.playerId = playerId;
      mockGameService.playCard.mockResolvedValue({
        success: true,
      });

      // Act
      await playCardHandler(cardId, callback);

      // Assert
      expect(mockGameService.playCard).toHaveBeenCalledWith(playerId, cardId);
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should handle card play failure when not logged in', async () => {
      // Arrange
      const cardId = 5;
      const callback = jest.fn();
      // playerId is not set

      // Act
      await playCardHandler(cardId, callback);

      // Assert
      expect(mockGameService.playCard).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(false, 'Not logged in');
    });

    it('should handle card play failure from service', async () => {
      // Arrange
      const playerId = 1;
      const cardId = 5;
      const callback = jest.fn();
      const errorMessage = 'Invalid move';

      mockSocket.data.playerId = playerId;
      mockGameService.playCard.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      // Act
      await playCardHandler(cardId, callback);

      // Assert
      expect(mockGameService.playCard).toHaveBeenCalledWith(playerId, cardId);
      expect(callback).toHaveBeenCalledWith(false, errorMessage);
    });
  });

  describe('exchangeCards handler', () => {
    let exchangeCardsHandler: Function;

    beforeEach(() => {
      socketHandlers.handleConnection(mockSocket);
      // exchangeCardsハンドラーを取得
      const exchangeCardsCall = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'exchangeCards'
      );
      exchangeCardsHandler = exchangeCardsCall[1];
    });

    it('should handle successful card exchange', async () => {
      // Arrange
      const playerId = 1;
      const cardIds = [1, 2, 3];
      const callback = jest.fn();

      mockSocket.data.playerId = playerId;
      mockGameService.exchangeCards.mockResolvedValue({
        success: true,
      });

      // Act
      await exchangeCardsHandler(cardIds, callback);

      // Assert
      expect(mockGameService.exchangeCards).toHaveBeenCalledWith(playerId, cardIds);
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should handle card exchange failure when not logged in', async () => {
      // Arrange
      const cardIds = [1, 2, 3];
      const callback = jest.fn();
      // playerId is not set

      // Act
      await exchangeCardsHandler(cardIds, callback);

      // Assert
      expect(mockGameService.exchangeCards).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(false, 'Not logged in');
    });

    it('should handle card exchange failure from service', async () => {
      // Arrange
      const playerId = 1;
      const cardIds = [1, 2, 3];
      const callback = jest.fn();
      const errorMessage = 'Invalid exchange';

      mockSocket.data.playerId = playerId;
      mockGameService.exchangeCards.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      // Act
      await exchangeCardsHandler(cardIds, callback);

      // Assert
      expect(mockGameService.exchangeCards).toHaveBeenCalledWith(playerId, cardIds);
      expect(callback).toHaveBeenCalledWith(false, errorMessage);
    });
  });

  describe('disconnect handler', () => {
    it('should handle disconnect event', (done) => {
      // Arrange
      const playerId = 1;
      mockSocket.data.playerId = playerId;
      
      // setTimeoutをモック化
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        // すぐに実行
        callback();
        return 0 as any;
      });
      
      socketHandlers.handleConnection(mockSocket);
      
      // disconnectハンドラーを取得
      const disconnectCall = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'disconnect'
      );
      const disconnectHandler = disconnectCall[1];

      // Act
      disconnectHandler('client disconnect');

      // Assert
      // モックされたsetTimeoutにより即座に実行される
      setTimeout(() => {
        expect(mockGameService.removePlayer).toHaveBeenCalledWith(playerId);
        jest.restoreAllMocks();
        done();
      }, 0);
    });
  });

  describe('error handler', () => {
    it('should handle error event', () => {
      // Arrange
      socketHandlers.handleConnection(mockSocket);
      
      // errorハンドラーを取得
      const errorCall = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      );
      const errorHandler = errorCall[1];

      // Act
      errorHandler(new Error('Test error'));

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', 'Connection error occurred');
    });
  });
});