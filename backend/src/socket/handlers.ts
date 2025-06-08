import { Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';
import { GameService } from '../services/GameService';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../types';

type SocketType = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class SocketHandlers {
  private gameService: GameService;
  private prisma: PrismaClient;
  private static playerSocketMap: Map<number, string> = new Map(); // プレイヤーID -> ソケットID
  private static socketPlayerMap: Map<string, number> = new Map(); // ソケットID -> プレイヤーID

  constructor() {
    this.gameService = GameService.getInstance();
    this.prisma = PrismaService.getInstance().getClient();
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
          console.log(`Successful join, sending gameInfo back on socket ${socket.id}`);
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
          const currentSocket = Array.from(this.gameService['io']?.sockets.sockets.values() || [])
            .find(s => s.data.playerId === socket.data.playerId);
          
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