import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import type { 
  ServerSocket, 
  EmoteType,
  ClientToServerEvents,
  ServerToClientEvents
} from '../../types';

describe('Emote Handlers', () => {
  let httpServer: any;
  let io: SocketIOServer;
  let clientSockets: ClientSocket[] = [];
  let serverSockets: ServerSocket[] = [];
  let port: number;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      io = new SocketIOServer(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      // エモートハンドラーの設定
      io.on('connection', (socket: ServerSocket) => {
        serverSockets.push(socket);
        
        // sendEmoteハンドラー
        socket.on('sendEmote', (emoteType: EmoteType) => {
          const playerId = socket.data.playerId;
          const gameId = socket.data.gameId;

          // バリデーション: ゲーム参加中のプレイヤーのみ許可
          if (!playerId || !gameId) {
            socket.emit('error', 'ゲームに参加していません');
            return;
          }

          // バリデーション: 有効なエモートタイプのみ許可
          if (!['👎', '🔥', '🚮'].includes(emoteType)) {
            socket.emit('error', '無効なエモートタイプです');
            return;
          }

          // 全プレイヤーに配信（送信者を含む）
          io.emit('receiveEmote', { playerId, emoteType });
        });
      });

      httpServer.listen(() => {
        port = (httpServer.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  afterEach(() => {
    // テスト後にクライアントソケットをクリーンアップ
    clientSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    clientSockets.length = 0;
    serverSockets.length = 0;
  });

  const createClientSocket = () => {
    return new Promise<ClientSocket>((resolve) => {
      const clientSocket = Client(`http://localhost:${port}`);
      clientSockets.push(clientSocket);
      clientSocket.on('connect', () => resolve(clientSocket));
    });
  };

  const setSocketData = (socket: ServerSocket, playerId: number, gameId: number) => {
    socket.data.playerId = playerId;
    socket.data.gameId = gameId;
  };

  describe('sendEmote event handler', () => {
    it('should broadcast valid emote to all players', async () => {
      const client1 = await createClientSocket();
      const client2 = await createClientSocket();

      // プレイヤー1のソケットデータを設定
      setSocketData(serverSockets[0], 1, 1);

      const emoteType: EmoteType = '👎';
      const receivedEmotes: Array<{ playerId: number; emoteType: EmoteType }> = [];

      // 両方のクライアントでreceiveEmoteイベントをリッスン
      client1.on('receiveEmote', (data) => receivedEmotes.push(data));
      client2.on('receiveEmote', (data) => receivedEmotes.push(data));

      // プレイヤー1がエモートを送信
      client1.emit('sendEmote', emoteType);

      // 少し待って結果を確認
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedEmotes).toHaveLength(2); // 両方のクライアントが受信
      expect(receivedEmotes[0]).toEqual({ playerId: 1, emoteType: '👎' });
      expect(receivedEmotes[1]).toEqual({ playerId: 1, emoteType: '👎' });
    });

    it('should reject invalid emote type', async () => {
      const client = await createClientSocket();
      setSocketData(serverSockets[0], 1, 1);

      const errors: string[] = [];
      client.on('error', (error) => errors.push(error));

      // 無効なエモートタイプを送信
      client.emit('sendEmote', '😀' as EmoteType);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errors).toHaveLength(1);
      expect(errors[0]).toBe('無効なエモートタイプです');
    });

    it('should reject emote from non-game participant', async () => {
      const client = await createClientSocket();
      // ゲームに参加していない状態（データを設定しない）

      const errors: string[] = [];
      client.on('error', (error) => errors.push(error));

      client.emit('sendEmote', '👎' as EmoteType);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errors).toHaveLength(1);
      expect(errors[0]).toBe('ゲームに参加していません');
    });

    it('should include correct sender information', async () => {
      const client1 = await createClientSocket();
      const client2 = await createClientSocket();

      setSocketData(serverSockets[0], 42, 1); // プレイヤーID: 42

      const receivedEmotes: Array<{ playerId: number; emoteType: EmoteType }> = [];
      client2.on('receiveEmote', (data) => receivedEmotes.push(data));

      client1.emit('sendEmote', '🔥' as EmoteType);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedEmotes).toHaveLength(1);
      expect(receivedEmotes[0].playerId).toBe(42);
      expect(receivedEmotes[0].emoteType).toBe('🔥');
    });

    it('should handle all three emote types correctly', async () => {
      const client = await createClientSocket();
      setSocketData(serverSockets[0], 1, 1);

      const receivedEmotes: Array<{ playerId: number; emoteType: EmoteType }> = [];
      client.on('receiveEmote', (data) => receivedEmotes.push(data));

      const emoteTypes: EmoteType[] = ['👎', '🔥', '🚮'];

      // 各エモートタイプを順番に送信
      for (const emoteType of emoteTypes) {
        client.emit('sendEmote', emoteType);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedEmotes).toHaveLength(3);
      expect(receivedEmotes[0].emoteType).toBe('👎');
      expect(receivedEmotes[1].emoteType).toBe('🔥');
      expect(receivedEmotes[2].emoteType).toBe('🚮');
    });
  });
});