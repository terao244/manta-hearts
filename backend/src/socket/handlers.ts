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

  constructor() {
    this.gameService = GameService.getInstance();
    this.prisma = PrismaService.getInstance().getClient();
  }

  public handleConnection(socket: SocketType): void {
    console.log(`Socket connected: ${socket.id}`);

    // 接続状態を送信
    socket.emit('connectionStatus', 'connected');

    // ログイン処理
    socket.on('login', async (playerName, callback) => {
      try {
        console.log(`Login attempt: ${playerName}`);

        // プレイヤー情報を取得
        const player = await this.prisma.player.findUnique({
          where: { name: playerName },
        });

        if (!player || !player.isActive) {
          console.log(`Login failed for: ${playerName} (player not found or inactive)`);
          callback(false);
          return;
        }

        // Socket データにプレイヤー情報を保存
        socket.data.playerId = player.id;
        socket.data.playerName = player.name;

        // プレイヤーの最終アクティブ時刻を更新
        await this.prisma.player.update({
          where: { id: player.id },
          data: { updatedAt: new Date() }
        });

        console.log(`Player logged in: ${player.name} (ID: ${player.id})`);

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
    socket.on('joinGame', async (callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback(false);
          return;
        }

        console.log(`Player ${playerId} attempting to join game`);

        const result = await this.gameService.joinGame(playerId);
        if (result.success && result.gameInfo) {
          callback(true, result.gameInfo);
        } else {
          callback(false);
        }
      } catch (error) {
        console.error('Join game error:', error);
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

    // 再接続処理
    socket.on('reconnect', () => {
      console.log(`Socket reconnected: ${socket.id}`);
      socket.emit('connectionStatus', 'reconnected');
    });

    // 切断処理
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);

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