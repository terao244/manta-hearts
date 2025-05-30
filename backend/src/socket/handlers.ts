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

    // ログイン処理
    socket.on('login', async (playerName, callback) => {
      try {
        console.log(`Login attempt: ${playerName}`);

        // プレイヤー情報を取得
        const player = await this.prisma.player.findUnique({
          where: { name: playerName },
        });

        if (!player || !player.isActive) {
          callback(false);
          return;
        }

        // Socket データにプレイヤー情報を保存
        socket.data.playerId = player.id;
        socket.data.playerName = player.name;

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

    // 切断処理
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      if (socket.data.playerId) {
        console.log(`Player ${socket.data.playerId} disconnected`);
        this.gameService.removePlayer(socket.data.playerId);
      }
    });

    // エラーハンドリング
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
}