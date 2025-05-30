import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import playersRouter from './routes/players';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './types';

// 環境変数の読み込み
dotenv.config();

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

// Socket.ioの設定
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// CORS設定
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());

// ロギング設定
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API情報エンドポイント
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Hearts Game Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// APIルート
app.use('/api/players', playersRouter);

// 404エラーハンドラー
app.use(notFoundHandler);

// エラーハンドリングミドルウェア
app.use(errorHandler);

// Socket.io接続処理
io.on('connection', socket => {
  console.log(`Socket connected: ${socket.id}`);

  // ログイン処理
  socket.on('login', async (playerName, callback) => {
    try {
      console.log(`Login attempt: ${playerName}`);

      // プレイヤー情報を取得
      const player = await prisma.player.findUnique({
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
  socket.on('joinGame', async callback => {
    try {
      const playerId = socket.data.playerId;
      if (!playerId) {
        callback(false);
        return;
      }

      console.log(`Player ${playerId} attempting to join game`);

      // TODO: ゲーム参加ロジックを実装
      // 現在は基本的な応答のみ
      callback(true, {
        gameId: 1,
        status: 'PLAYING',
        players: [],
        phase: 'waiting',
        heartsBroken: false,
        tricks: [],
        scores: {},
      });
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

      // TODO: カードプレイロジックを実装
      callback(true);
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

      // TODO: カード交換ロジックを実装
      callback(true);
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
      // TODO: 切断処理ロジックを実装
    }
  });

  // エラーハンドリング
  socket.on('error', error => {
    console.error('Socket error:', error);
  });
});

// グレースフル シャットダウン
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');

  try {
    await prisma.$disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');

  try {
    await prisma.$disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;

// テスト環境では自動起動しない
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Hearts Game Backend Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(
      `Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`
    );
  });
}

export { app, server, io, prisma };
