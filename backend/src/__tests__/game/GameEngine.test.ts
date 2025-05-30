import { GameEngine, GameEngineEvents } from '../../game/GameEngine';
import { GamePhase, GameStatus, ExchangeDirection } from '../../game/GameState';
import { PlayerPosition } from '../../game/Player';
import { Suit, Rank } from '../../game/Card';

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockEventListeners: Partial<GameEngineEvents>;
  let mockPlayers: any[];

  beforeEach(() => {
    mockEventListeners = {
      onGameStateChanged: jest.fn(),
      onPlayerJoined: jest.fn(),
      onPlayerLeft: jest.fn(),
      onHandStarted: jest.fn(),
      onCardsDealt: jest.fn(),
      onExchangePhaseStarted: jest.fn(),
      onPlayingPhaseStarted: jest.fn(),
      onCardPlayed: jest.fn(),
      onTrickCompleted: jest.fn(),
      onHandCompleted: jest.fn(),
      onGameCompleted: jest.fn(),
      onError: jest.fn()
    };

    gameEngine = new GameEngine(1, mockEventListeners);

    mockPlayers = [
      {
        id: 1,
        name: 'Player1',
        displayName: 'Player 1',
        position: PlayerPosition.NORTH,
        score: 0,
        cumulativeScore: 0,
        isConnected: true,
        lastActiveAt: new Date()
      },
      {
        id: 2,
        name: 'Player2',
        displayName: 'Player 2',
        position: PlayerPosition.EAST,
        score: 0,
        cumulativeScore: 0,
        isConnected: true,
        lastActiveAt: new Date()
      },
      {
        id: 3,
        name: 'Player3',
        displayName: 'Player 3',
        position: PlayerPosition.SOUTH,
        score: 0,
        cumulativeScore: 0,
        isConnected: true,
        lastActiveAt: new Date()
      },
      {
        id: 4,
        name: 'Player4',
        displayName: 'Player 4',
        position: PlayerPosition.WEST,
        score: 0,
        cumulativeScore: 0,
        isConnected: true,
        lastActiveAt: new Date()
      }
    ];
  });

  describe('constructor', () => {
    it('正しい初期状態でGameEngineを作成する', () => {
      const gameState = gameEngine.getGameState();
      
      expect(gameState.gameId).toBe(1);
      expect(gameState.status).toBe(GameStatus.PLAYING);
      expect(gameState.phase).toBe(GamePhase.WAITING);
      expect(gameState.getPlayerCount()).toBe(0);
    });
  });

  describe('addPlayer', () => {
    it('プレイヤーを追加する', () => {
      const success = gameEngine.addPlayer(mockPlayers[0]);
      
      expect(success).toBe(true);
      expect(mockEventListeners.onPlayerJoined).toHaveBeenCalledWith(1);
      expect(mockEventListeners.onGameStateChanged).toHaveBeenCalled();
      
      const gameState = gameEngine.getGameState();
      expect(gameState.getPlayerCount()).toBe(1);
    });

    it('5人目のプレイヤー追加は失敗する', () => {
      mockPlayers.forEach(player => gameEngine.addPlayer(player));
      
      const extraPlayer = { ...mockPlayers[0], id: 5 };
      const success = gameEngine.addPlayer(extraPlayer);
      
      expect(success).toBe(false);
      expect(gameEngine.getGameState().getPlayerCount()).toBe(4);
    });
  });

  describe('startGame', () => {
    it('4人揃った場合にゲームを開始する', () => {
      mockPlayers.forEach(player => gameEngine.addPlayer(player));
      
      const success = gameEngine.startGame();
      
      expect(success).toBe(true);
      expect(mockEventListeners.onHandStarted).toHaveBeenCalledWith(1);
      expect(mockEventListeners.onCardsDealt).toHaveBeenCalled();
      
      const gameState = gameEngine.getGameState();
      expect(gameState.currentHand).toBe(1);
      expect(gameState.phase).toBe(GamePhase.EXCHANGING); // 最初は交換フェーズ
    });

    it('4人未満では開始できない', () => {
      gameEngine.addPlayer(mockPlayers[0]);
      gameEngine.addPlayer(mockPlayers[1]);
      
      const success = gameEngine.startGame();
      
      expect(success).toBe(false);
      expect(mockEventListeners.onHandStarted).not.toHaveBeenCalled();
    });
  });

  describe('dealCards', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameEngine.addPlayer(player));
    });

    it('各プレイヤーに13枚ずつカードを配る', () => {
      gameEngine.dealCards();
      
      expect(mockEventListeners.onCardsDealt).toHaveBeenCalled();
      
      const dealtHands = (mockEventListeners.onCardsDealt as jest.Mock).mock.calls[0][0];
      expect(dealtHands.size).toBe(4);
      
      dealtHands.forEach((hand: any[], playerId: number) => {
        expect(hand.length).toBe(13);
        expect(gameEngine.getPlayerHand(playerId).length).toBe(13);
      });
    });
  });

  describe('exchangeCards', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameEngine.addPlayer(player));
      gameEngine.startGame();
    });

    it('交換フェーズで3枚のカードを交換する', () => {
      const player1Hand = gameEngine.getPlayerHand(1);
      const cardIds = player1Hand.slice(0, 3).map(card => card.id);
      
      const success = gameEngine.exchangeCards(1, cardIds);
      
      expect(success).toBe(true);
      expect(mockEventListeners.onGameStateChanged).toHaveBeenCalled();
    });

    it('交換フェーズ以外では交換できない', () => {
      const gameState = gameEngine.getGameState();
      gameState.phase = GamePhase.PLAYING;
      
      const success = gameEngine.exchangeCards(1, [1, 2, 3]);
      
      expect(success).toBe(false);
    });

    it('全プレイヤーが交換完了後にプレイフェーズに移行する', () => {
      // 全プレイヤーがカード交換を行う
      for (let i = 1; i <= 4; i++) {
        const playerHand = gameEngine.getPlayerHand(i);
        const cardIds = playerHand.slice(0, 3).map(card => card.id);
        gameEngine.exchangeCards(i, cardIds);
      }
      
      expect(mockEventListeners.onPlayingPhaseStarted).toHaveBeenCalled();
      
      const gameState = gameEngine.getGameState();
      expect(gameState.phase).toBe(GamePhase.PLAYING);
    });
  });

  describe('playCard', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameEngine.addPlayer(player));
      gameEngine.startGame();
      
      // 交換をスキップしてプレイフェーズに移行
      const gameState = gameEngine.getGameState();
      gameState.exchangeDirection = ExchangeDirection.NONE;
      gameEngine.startPlayingPhase();
    });

    it('有効なカードをプレイする', () => {
      const currentTurn = gameEngine.getCurrentTurn()!;
      const playerHand = gameEngine.getPlayerHand(currentTurn);
      
      // クラブの2があるかチェック、なければ最初のカード
      const clubTwo = playerHand.find(card => card.suit === Suit.CLUBS && card.rank === Rank.TWO);
      const cardToPlay = clubTwo || playerHand[0];
      
      const success = gameEngine.playCard(currentTurn, cardToPlay.id);
      
      expect(success).toBe(true);
      expect(mockEventListeners.onCardPlayed).toHaveBeenCalledWith(currentTurn, cardToPlay);
      expect(mockEventListeners.onGameStateChanged).toHaveBeenCalled();
    });

    it('プレイフェーズ以外ではカードをプレイできない', () => {
      const gameState = gameEngine.getGameState();
      gameState.phase = GamePhase.EXCHANGING;
      
      const success = gameEngine.playCard(1, 1);
      
      expect(success).toBe(false);
    });

    it('自分のターンでないとカードをプレイできない', () => {
      const currentTurn = gameEngine.getCurrentTurn()!;
      const otherPlayerId = currentTurn === 1 ? 2 : 1;
      
      const success = gameEngine.playCard(otherPlayerId, 1);
      
      expect(success).toBe(false);
    });
  });

  describe('isValidMove', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameEngine.addPlayer(player));
      gameEngine.startGame();
    });

    it('有効な手を判定する', () => {
      const gameState = gameEngine.getGameState();
      gameState.exchangeDirection = ExchangeDirection.NONE;
      gameEngine.startPlayingPhase();
      
      const currentTurn = gameEngine.getCurrentTurn()!;
      const playerHand = gameEngine.getPlayerHand(currentTurn);
      const validCard = playerHand[0];
      
      const isValid = gameEngine.isValidMove(currentTurn, validCard.id);
      expect(isValid).toBe(true);
    });

    it('存在しないカードIDは無効', () => {
      const isValid = gameEngine.isValidMove(1, 999);
      expect(isValid).toBe(false);
    });
  });

  describe('getScore', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameEngine.addPlayer(player));
    });

    it('プレイヤーのスコアを取得する', () => {
      const gameState = gameEngine.getGameState();
      gameState.cumulativeScores.set(1, 25);
      
      const score = gameEngine.getScore(1);
      expect(score).toBe(25);
    });

    it('存在しないプレイヤーは0を返す', () => {
      const score = gameEngine.getScore(999);
      expect(score).toBe(0);
    });
  });

  describe('removePlayer', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameEngine.addPlayer(player));
    });

    it('プレイヤーを削除する', () => {
      const success = gameEngine.removePlayer(1);
      
      expect(success).toBe(true);
      expect(mockEventListeners.onPlayerLeft).toHaveBeenCalledWith(1);
      expect(mockEventListeners.onGameStateChanged).toHaveBeenCalled();
    });

    it('ゲーム中にプレイヤーが離脱するとゲームを一時停止する', () => {
      gameEngine.startGame();
      gameEngine.removePlayer(1);
      
      const gameState = gameEngine.getGameState();
      expect(gameState.status).toBe(GameStatus.PAUSED);
    });

    it('存在しないプレイヤーの削除は失敗する', () => {
      const success = gameEngine.removePlayer(999);
      expect(success).toBe(false);
    });
  });
});