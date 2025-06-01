import { GameEngine, GameEngineEvents } from '../game/GameEngine';
import { GamePlayer, PlayerPosition } from '../game/Player';
import { Card } from '../game/Card';
import { GameStatus } from '../game/GameState';
import { PrismaService } from './PrismaService';
import { Server } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  CardInfo,
  GameInfo,
  GameState as GameStateType,
} from '../types';


export class GameService {
  private static instance: GameService;
  private gameEngines: Map<number, GameEngine> = new Map();
  private playerGameMap: Map<number, number> = new Map();
  private gamePlayersMap: Map<number, Set<number>> = new Map();
  private io?: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  
  private constructor() {}

  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  public setSocketIO(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    this.io = io;
  }

  private cardToCardInfo(card: Card): CardInfo {
    return {
      id: card.id,
      suit: card.suit,
      rank: card.rank,
      code: card.code,
      pointValue: card.pointValue,
      sortOrder: card.sortOrder,
    };
  }

  public async joinGame(playerId: number): Promise<{ success: boolean; gameInfo?: GameInfo }> {
    try {
      console.log(`GameService.joinGame called for player ${playerId}`);
      
      let gameId: number;
      let isRejoining = false;
      
      // 1. まず既存のゲームを確認
      const existingGameId = this.playerGameMap.get(playerId);
      if (existingGameId && this.gameEngines.has(existingGameId)) {
        const existingEngine = this.gameEngines.get(existingGameId)!;
        const gameState = existingEngine.getGameState();
        
        // ゲームが終了していない場合のみ復帰
        if (gameState.status !== GameStatus.FINISHED) {
          console.log(`Player ${playerId} rejoining existing game ${existingGameId}`);
          gameId = existingGameId;
          isRejoining = true;
        } else {
          // 終了済みゲームの場合、マッピングをクリア
          console.log(`Player ${playerId} leaving completed game ${existingGameId}`);
          this.playerGameMap.delete(playerId);
          const players = this.gamePlayersMap.get(existingGameId);
          if (players) {
            players.delete(playerId);
            if (players.size === 0) {
              this.gameEngines.delete(existingGameId);
              this.gamePlayersMap.delete(existingGameId);
            }
          }
          gameId = this.findAvailableGame() || await this.createNewGame();
        }
      } else {
        // 2. 新規ゲーム参加
        gameId = this.findAvailableGame() || await this.createNewGame();
      }
      
      console.log(`Using game ID: ${gameId}, isRejoining: ${isRejoining}`);
      
      let gameEngine = this.gameEngines.get(gameId);
      if (!gameEngine) {
        console.log(`Creating new game engine for game ${gameId}`);
        gameEngine = this.createGameEngine(gameId);
        this.gameEngines.set(gameId, gameEngine);
      }

      // プレイヤー情報を取得
      const prismaService = PrismaService.getInstance();
      const prisma = prismaService.getClient();
      const playerData = await prisma.player.findUnique({
        where: { id: playerId }
      });

      if (!playerData || !playerData.isActive) {
        return { success: false };
      }

      let success = true;
      
      if (isRejoining) {
        // 復帰時：既存プレイヤーの接続状態を更新
        console.log(`Updating connection status for rejoining player ${playerId}`);
        const gameState = gameEngine.getGameState();
        const existingPlayer = gameState.getPlayer(playerId);
        if (existingPlayer) {
          existingPlayer.isConnected = true;
          existingPlayer.lastActiveAt = new Date();
          console.log(`Player ${playerId} reconnected to game ${gameId}`);
        } else {
          console.warn(`Player ${playerId} not found in existing game ${gameId}`);
          success = false;
        }
      } else {
        // 新規参加：ゲームにプレイヤーを追加
        const position = this.assignPlayerPosition(gameId);
        const gamePlayer: Omit<GamePlayer, 'hand' | 'exchangeCards' | 'hasExchanged' | 'hasPlayedInTrick'> = {
          id: playerId,
          name: playerData.name,
          displayName: playerData.displayName,
          position,
          score: 0,
          cumulativeScore: 0,
          isConnected: true,
          lastActiveAt: new Date()
        };

        success = gameEngine.addPlayer(gamePlayer);
        if (success) {
          this.playerGameMap.set(playerId, gameId);
          
          let players = this.gamePlayersMap.get(gameId);
          if (!players) {
            players = new Set();
            this.gamePlayersMap.set(gameId, players);
          }
          players.add(playerId);

          console.log(`Player ${playerId} joined new game ${gameId}`);
        }
      }

      if (success) {
        // ゲームセッションをデータベースに保存（必要に応じて実装）

        const gameInfo = this.getGameInfo(gameId, playerId);
        
        // 新規参加でゲームが満員になった場合、自動でゲーム開始
        if (!isRejoining && gameEngine.getGameState().isFull()) {
          gameEngine.startGame();
        }

        return { success: true, gameInfo: gameInfo || undefined };
      }

      return { success: false };
    } catch (error) {
      console.error('Error joining game:', error);
      return { success: false };
    }
  }

  public async playCard(playerId: number, cardId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const gameId = this.playerGameMap.get(playerId);
      if (!gameId) {
        return { success: false, error: 'Player not in game' };
      }

      const gameEngine = this.gameEngines.get(gameId);
      if (!gameEngine) {
        return { success: false, error: 'Game not found' };
      }

      const success = gameEngine.playCard(playerId, cardId);
      if (!success) {
        return { success: false, error: 'Invalid move' };
      }

      // カードプレイ成功後、全プレイヤーに更新された手札情報を送信
      this.sendUpdatedHandsToAllPlayers(gameId, gameEngine);

      return { success: true };
    } catch (error) {
      console.error('Error playing card:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  public async exchangeCards(playerId: number, cardIds: number[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (cardIds.length !== 3) {
        return { success: false, error: 'Must exchange exactly 3 cards' };
      }

      const gameId = this.playerGameMap.get(playerId);
      if (!gameId) {
        return { success: false, error: 'Player not in game' };
      }

      const gameEngine = this.gameEngines.get(gameId);
      if (!gameEngine) {
        return { success: false, error: 'Game not found' };
      }

      const success = gameEngine.exchangeCards(playerId, cardIds);
      if (!success) {
        return { success: false, error: 'Invalid exchange' };
      }

      // 交換成功後、全プレイヤーに更新された手札情報を送信
      this.sendUpdatedHandsToAllPlayers(gameId, gameEngine);

      return { success: true };
    } catch (error) {
      console.error('Error exchanging cards:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  public getGameInfo(gameId: number, playerId?: number): GameInfo | null {
    const gameEngine = this.gameEngines.get(gameId);
    if (!gameEngine) return null;

    const gameState = gameEngine.getGameState();
    const players = gameState.getAllPlayers().map(player => ({
      id: player.id,
      name: player.name,
      position: player.position,
      score: gameEngine.getScore(player.id)
    }));

    const gameInfo: GameInfo = {
      gameId,
      status: gameState.status,
      players,
      phase: gameState.phase,
      currentTurn: gameState.currentTurn,
      heartsBroken: gameState.heartsBroken,
      tricks: gameState.tricks,
      scores: Object.fromEntries(gameState.cumulativeScores)
    };

    // プレイヤーIDが指定されている場合、手札情報を追加
    if (playerId) {
      gameInfo.hand = gameEngine.getPlayerHand(playerId).map(card => this.cardToCardInfo(card));
    }

    return gameInfo;
  }

  public removePlayer(playerId: number): boolean {
    const gameId = this.playerGameMap.get(playerId);
    if (!gameId) return false;

    const gameEngine = this.gameEngines.get(gameId);
    if (!gameEngine) return false;

    const success = gameEngine.removePlayer(playerId);
    if (success) {
      this.playerGameMap.delete(playerId);
      
      const players = this.gamePlayersMap.get(gameId);
      if (players) {
        players.delete(playerId);
        
        // ゲームにプレイヤーがいなくなった場合、ゲームを削除
        if (players.size === 0) {
          this.gameEngines.delete(gameId);
          this.gamePlayersMap.delete(gameId);
        }
      }
    }

    return success;
  }

  private findAvailableGame(): number | null {
    for (const [gameId, gameEngine] of this.gameEngines) {
      const gameState = gameEngine.getGameState();
      if (!gameState.isFull() && gameState.phase === 'waiting') {
        return gameId;
      }
    }
    return null;
  }

  private async createNewGame(): Promise<number> {
    try {
      const prismaService = PrismaService.getInstance();
      const prisma = prismaService.getClient();
      
      // データベースに新しいゲームレコードを作成
      const game = await prisma.game.create({
        data: {
          status: 'PLAYING',
          startTime: new Date()
        }
      });
      
      return game.id;
    } catch (error) {
      console.error('Error creating new game:', error);
      // フォールバック: タイムスタンプをゲームIDとして使用
      return Date.now();
    }
  }

  private createGameEngine(gameId: number): GameEngine {
    const eventListeners: Partial<GameEngineEvents> = {
      onGameStateChanged: (gameState) => {
        this.broadcastToGame(gameId, 'gameStateChanged', {
          gameId,
          status: gameState.status,
          phase: gameState.phase,
          currentTurn: gameState.currentTurn,
          heartsBroken: gameState.heartsBroken,
          tricks: gameState.tricks,
          scores: Object.fromEntries(gameState.cumulativeScores)
        });
      },
      onPlayerJoined: (playerId) => {
        this.broadcastToGame(gameId, 'playerJoined', playerId);
      },
      onPlayerLeft: (playerId) => {
        this.broadcastToGame(gameId, 'playerLeft', playerId);
      },
      onHandStarted: (handNumber) => {
        this.broadcastToGame(gameId, 'handStarted', handNumber);
      },
      onCardsDealt: (playerHands) => {
        // 各プレイヤーに個別に手札を送信
        playerHands.forEach((cards, playerId) => {
          const cardInfos = cards.map(card => this.cardToCardInfo(card));
          this.sendToPlayer(playerId, 'cardsDealt', cardInfos);
        });
      },
      onExchangePhaseStarted: (direction) => {
        this.broadcastToGame(gameId, 'exchangePhaseStarted', direction);
      },
      onExchangeProgress: (exchangedPlayers, remainingPlayers) => {
        this.broadcastToGame(gameId, 'exchangeProgress', { exchangedPlayers, remainingPlayers });
      },
      onPlayingPhaseStarted: (leadPlayerId) => {
        this.broadcastToGame(gameId, 'playingPhaseStarted', leadPlayerId);
      },
      onCardPlayed: (playerId, card) => {
        this.broadcastToGame(gameId, 'cardPlayed', { playerId, card: this.cardToCardInfo(card) });
      },
      onTrickCompleted: (trickNumber, winnerId, points) => {
        this.broadcastToGame(gameId, 'trickCompleted', { trickNumber, winnerId, points });
        
        // 現在のハンドスコアも送信
        const gameEngine = this.gameEngines.get(gameId);
        if (gameEngine) {
          const gameState = gameEngine.getGameState();
          const currentHandScores = Object.fromEntries(gameState.getCurrentHandScores());
          this.broadcastToGame(gameId, 'handScoreUpdate', currentHandScores);
        }
      },
      onHandCompleted: (handNumber, scores) => {
        this.broadcastToGame(gameId, 'handCompleted', { 
          handNumber, 
          scores: Object.fromEntries(scores) 
        });
      },
      onGameCompleted: async (winnerId, finalScores) => {
        // ゲーム結果をデータベースに保存
        const gameStartTime = Date.now(); // 実際にはGameEngineから取得する必要がある
        const duration = Math.floor((Date.now() - gameStartTime) / 60000); // 分単位
        await this.saveGameResult(gameId, winnerId, duration);
        
        this.broadcastToGame(gameId, 'gameCompleted', { 
          winnerId, 
          finalScores: Object.fromEntries(finalScores) 
        });
      },
      onError: (error) => {
        console.error(`Game ${gameId} error:`, error);
        this.broadcastToGame(gameId, 'error', error.message);
      }
    };

    return new GameEngine(gameId, eventListeners);
  }

  private assignPlayerPosition(gameId: number): PlayerPosition {
    const players = this.gamePlayersMap.get(gameId);
    const playerCount = players ? players.size : 0;

    switch (playerCount) {
      case 0:
        return PlayerPosition.NORTH;
      case 1:
        return PlayerPosition.EAST;
      case 2:
        return PlayerPosition.SOUTH;
      case 3:
        return PlayerPosition.WEST;
      default:
        throw new Error('Game is full');
    }
  }

  private broadcastToGame(gameId: number, event: string, data: any): void {
    if (!this.io) return;

    const players = this.gamePlayersMap.get(gameId);
    if (!players) return;

    players.forEach(playerId => {
      this.sendToPlayer(playerId, event, data);
    });
  }

  private sendToPlayer(playerId: number, event: string, data: any): void {
    if (!this.io) return;

    console.log(`Sending event '${event}' to player ${playerId}:`, data);

    // Socket.ioのルームやソケット管理を通じてプレイヤーに送信
    // setTimeoutで次のイベントループでの送信を保証（タイミング問題対策）
    setTimeout(() => {
      this.io!.sockets.sockets.forEach(socket => {
        if (socket.data.playerId === playerId) {
          console.log(`Found socket ${socket.id} for player ${playerId}, emitting event '${event}'`);
          socket.emit(event as any, data);
        }
      });
    }, 0);
  }

  public async saveGameResult(gameId: number, winnerId: number, duration: number): Promise<void> {
    try {
      const prismaService = PrismaService.getInstance();
      const prisma = prismaService.getClient();
      
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'FINISHED',
          winnerId: winnerId,
          duration: duration,
          endTime: new Date()
        }
      });
    } catch (error) {
      console.error(`Error saving game result for game ${gameId}:`, error);
    }
  }

  public getActiveGames(): number[] {
    return Array.from(this.gameEngines.keys());
  }

  public getPlayerCount(gameId: number): number {
    const players = this.gamePlayersMap.get(gameId);
    return players ? players.size : 0;
  }

  public getValidCards(playerId: number): number[] {
    const gameId = this.playerGameMap.get(playerId);
    if (!gameId) return [];

    const gameEngine = this.gameEngines.get(gameId);
    if (!gameEngine) return [];

    const gameState = gameEngine.getGameState();
    const player = gameState.getPlayer(playerId);
    if (!player) return [];

    // プレイヤーの手札から有効なカードのIDを返す
    return player.hand
      .filter(card => gameState.canPlayCard(playerId, card))
      .map(card => card.id);
  }

  private sendUpdatedHandsToAllPlayers(gameId: number, gameEngine: GameEngine): void {
    const players = this.gamePlayersMap.get(gameId);
    if (!players) return;

    players.forEach(playerId => {
      const playerHand = gameEngine.getPlayerHand(playerId);
      const cardInfos = playerHand.map(card => this.cardToCardInfo(card));
      this.sendToPlayer(playerId, 'handUpdated', cardInfos);
    });
  }
}