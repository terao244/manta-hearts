import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import playersRouter from './routes/players';
import gamesRouter from './routes/games';
import { GameService } from './services/GameService';
import { SocketHandlers } from './socket/handlers';
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
app.use('/api/games', gamesRouter);

// 404エラーハンドラー
app.use(notFoundHandler);

// エラーハンドリングミドルウェア
app.use(errorHandler);

// GameServiceとSocket.ioの統合
const gameService = GameService.getInstance();
gameService.setSocketIO(io);

// Socket.ioハンドラーの初期化
const socketHandlers = new SocketHandlers(io);

// Socket.io接続処理
io.on('connection', (socket) => {
  socketHandlers.handleConnection(socket);
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
