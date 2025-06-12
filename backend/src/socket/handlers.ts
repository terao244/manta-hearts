import { Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';
import { GameService } from '../services/GameService';
import { EMOTE_ERROR_MESSAGES, isValidEmoteType } from '../constants/emote';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  EmoteType,
} from '../types';

type SocketType = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class SocketHandlers {
  private gameService: GameService;
  private prisma: PrismaClient;
  private io?: SocketType['server'];
  private static playerSocketMap: Map<number, string> = new Map(); // プレイヤーID -> ソケットID
  private static socketPlayerMap: Map<string, number> = new Map(); // ソケットID -> プレイヤーID

  constructor(io?: SocketType['server']) {
    this.gameService = GameService.getInstance();
    this.prisma = PrismaService.getInstance().getClient();
    this.io = io;
  }

  public handleConnection(socket: SocketType): void {
    console.log(`Socket connected: ${socket.id}`);

    // 接続状態を送信
    socket.emit('connectionStatus', 'connected');

    // ログイン処理
    socket.on('login', async (playerId, callback) => {
      try {
        console.log(`Login attempt: Player ID ${playerId} on socket ${socket.id}`);

        // プレイヤー情報を取得
        const player = await this.prisma.player.findUnique({
          where: { id: playerId },
        });

        if (!player || !player.isActive) {
          console.log(`Login failed for: Player ID ${playerId} (player not found or inactive) on socket ${socket.id}`);
          callback(false);
          return;
        }

        // Socket データにプレイヤー情報を保存
        socket.data.playerId = player.id;
        socket.data.playerName = player.name;

        // グローバルマッピングを更新
        SocketHandlers.playerSocketMap.set(player.id, socket.id);
        SocketHandlers.socketPlayerMap.set(socket.id, player.id);

        // プレイヤーの最終アクティブ時刻を更新
        await this.prisma.player.update({
          where: { id: player.id },
          data: { updatedAt: new Date() }
        });

        // プレイヤーが既にゲームに参加しているか確認
        const existingGameId = this.gameService.getPlayerGameId(player.id);
        if (existingGameId) {
          socket.data.gameId = existingGameId;
          console.log(`Player ${player.name} (ID: ${player.id}) already in game ${existingGameId}`);
        }

        console.log('[login] Socket data after login:', {
          socketId: socket.id,
          playerId: socket.data.playerId,
          gameId: socket.data.gameId,
          playerName: socket.data.playerName
        });

        console.log(`Player logged in: ${player.name} (ID: ${player.id}) on socket ${socket.id}`);

        callback(true, {
          id: player.id,
          name: player.name,
          displayName: player.displayName,
          displayOrder: player.displayOrder,
          isActive: player.isActive,
        });
      } catch (error) {
        console.error('Login error:', error);
        callback(false);
      }
    });

    // ゲーム参加処理
    socket.on('joinGame', async (playerId: number, callback) => {
      try {
        console.log(`JoinGame event received on socket ${socket.id} for player ${playerId}`);
        
        if (!playerId) {
          console.log(`Invalid player ID on socket ${socket.id}`);
          callback(false);
          return;
        }
        
        // プレイヤーIDの有効性を確認
        const player = await this.prisma.player.findUnique({
          where: { id: playerId, isActive: true }
        });
        
        if (!player) {
          console.log(`Player ${playerId} not found or inactive on socket ${socket.id}`);
          callback(false);
          return;
        }
        
        // 新しいソケットのマッピングを更新
        SocketHandlers.playerSocketMap.set(playerId, socket.id);
        SocketHandlers.socketPlayerMap.set(socket.id, playerId);
        socket.data.playerId = playerId;
        socket.data.playerName = player.name;

        console.log(`Player ${playerId} attempting to join game on socket ${socket.id}`);

        const result = await this.gameService.joinGame(playerId);
        console.log(`Game service result for socket ${socket.id}:`, result);
        
        if (result.success && result.gameInfo) {
          // ゲームIDをsocket.dataに保存
          socket.data.gameId = result.gameInfo.gameId;

          console.log('[joinGame] Socket data after join:', {
            socketId: socket.id,
            playerId: socket.data.playerId,
            gameId: socket.data.gameId,
            playerName: socket.data.playerName
          });
          console.log(`Successful join, sending gameInfo back on socket ${socket.id}, gameId: ${result.gameInfo.gameId}`);
          callback(true, result.gameInfo);
        } else {
          console.log(`Failed to join game on socket ${socket.id}`);
          callback(false);
        }
      } catch (error) {
        console.error(`Join game error on socket ${socket.id}:`, error);
        callback(false);
      }
    });

    // カードプレイ処理
    socket.on('playCard', async (cardId, callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback(false, 'Not logged in');
          return;
        }

        console.log(`Player ${playerId} played card ${cardId}`);

        const result = await this.gameService.playCard(playerId, cardId);
        if (result.success) {
          callback(true);
        } else {
          callback(false, result.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Play card error:', error);
        callback(false, 'Internal server error');
      }
    });

    // カード交換処理
    socket.on('exchangeCards', async (cardIds, callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback(false, 'Not logged in');
          return;
        }

        console.log(`Player ${playerId} exchanging cards:`, cardIds);

        const result = await this.gameService.exchangeCards(playerId, cardIds);
        if (result.success) {
          callback(true);
        } else {
          callback(false, result.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Exchange cards error:', error);
        callback(false, 'Internal server error');
      }
    });

    // 有効カード取得処理
    socket.on('getValidCards', (callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback([]);
          return;
        }

        const validCardIds = this.gameService.getValidCards(playerId);
        callback(validCardIds);
      } catch (error) {
        console.error('Get valid cards error:', error);
        callback([]);
      }
    });

    // エモート送信処理
    socket.on('sendEmote', (emoteType: EmoteType) => {
      try {
        const playerId = socket.data.playerId;
        let gameId = socket.data.gameId;

        // ソケットデータにgameIdがない場合は、GameServiceから取得
        if (!gameId && playerId) {
          gameId = this.gameService.getPlayerGameId(playerId);
          if (gameId) {
            socket.data.gameId = gameId; // ソケットデータも更新
          }
        }


        // バリデーション: ゲーム参加中のプレイヤーのみ許可
        if (!playerId || !gameId) {
          socket.emit('error', 'ゲームに参加していません');
          return;
        }

        // バリデーション: 有効なエモートタイプのみ許可
        if (!isValidEmoteType(emoteType)) {
          socket.emit('error', EMOTE_ERROR_MESSAGES.INVALID_TYPE);
          return;
        }

        // 同じゲームに参加している全プレイヤーに配信
        const gamePlayerIds = this.gameService.getGamePlayerIds(gameId);
        if (gamePlayerIds && gamePlayerIds.length > 0) {
          // 各プレイヤーのソケットに配信
          gamePlayerIds.forEach(pid => {
            const socketId = SocketHandlers.playerSocketMap.get(pid);
            if (socketId) {
              const playerSocket = this.io?.sockets.sockets.get(socketId);
              if (playerSocket) {
                playerSocket.emit('receiveEmote', { 
                  fromPlayerId: playerId, 
                  emoteType
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Send emote error:', error);
        socket.emit('error', EMOTE_ERROR_MESSAGES.SEND_FAILED);
      }
    });

    // 再接続処理
    socket.on('reconnect', () => {
      console.log(`Socket reconnected: ${socket.id}`);
      socket.emit('connectionStatus', 'reconnected');
    });

    // 切断処理
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);

      // マッピングから削除
      const playerId = SocketHandlers.socketPlayerMap.get(socket.id);
      if (playerId) {
        SocketHandlers.playerSocketMap.delete(playerId);
        SocketHandlers.socketPlayerMap.delete(socket.id);
        console.log(`Removed mappings for player ${playerId} on socket ${socket.id}`);
      }

      if (socket.data.playerId) {
        console.log(`Player ${socket.data.playerId} disconnected`);
        // 即座に削除せず、一定時間後に削除する（再接続を待つ）
        setTimeout(() => {
          const currentSocket = Array.from(this.io?.sockets.sockets.values() || [])
            .find((s: any) => s.data.playerId === socket.data.playerId);
          
          if (!currentSocket) {
            console.log(`Removing player ${socket.data.playerId} after timeout`);
            this.gameService.removePlayer(socket.data.playerId!);
          }
        }, 30000); // 30秒待機
      }
    });

    // エラーハンドリング
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
      socket.emit('error', 'Connection error occurred');
    });

    // ハートビート機能
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 25000); // 25秒ごとにpingを送信

    socket.on('pong', () => {
      // クライアントからのpong応答を受信
      console.log(`Received pong from ${socket.id}`);
    });
  }
}