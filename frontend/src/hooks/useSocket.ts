'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  ConnectionState,
  PlayerInfo,
  GameState 
} from '@/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const useSocket = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: undefined,
    reconnectAttempts: 0
  });

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    console.log('Initializing socket connection to:', BACKEND_URL);
    setConnectionState(prev => ({ ...prev, isConnecting: true }));

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // 接続成功
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnectionState({
        isConnected: true,
        isConnecting: false,
        error: undefined,
        reconnectAttempts: 0
      });
    });

    // 切断
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        error: `Connection lost: ${reason}`
      }));
    });

    // 接続エラー
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: `Failed to connect: ${error.message}`,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));
    });

    // 再接続試行
    socket.io.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('Reconnection attempt:', attemptNumber);
      setConnectionState(prev => ({
        ...prev,
        isConnecting: true,
        reconnectAttempts: attemptNumber
      }));
    });

    // 再接続成功
    socket.io.on('reconnect', (attemptNumber: number) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setConnectionState({
        isConnected: true,
        isConnecting: false,
        error: undefined,
        reconnectAttempts: 0
      });
    });

    // サーバーからのエラー
    socket.on('error', (error) => {
      console.error('Server error:', error);
      setConnectionState(prev => ({
        ...prev,
        error: `Server error: ${error}`
      }));
    });

    // クリーンアップ関数
    return () => {
      console.log('Cleaning up socket connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ログイン関数
  const login = async (playerName: string): Promise<{ success: boolean; playerInfo?: PlayerInfo; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socketRef.current.emit('login', playerName, (success, playerInfo) => {
        if (success && playerInfo) {
          resolve({ success: true, playerInfo });
        } else {
          resolve({ success: false, error: 'Login failed' });
        }
      });
    });
  };

  // ゲーム参加関数
  const joinGame = async (): Promise<{ success: boolean; gameState?: GameState; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socketRef.current.emit('joinGame', (success, gameState) => {
        if (success && gameState) {
          resolve({ success: true, gameState });
        } else {
          resolve({ success: false, error: 'Failed to join game' });
        }
      });
    });
  };

  // カードプレイ関数
  const playCard = async (cardId: number): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socketRef.current.emit('playCard', cardId, (success, error) => {
        resolve({ success, error });
      });
    });
  };

  // カード交換関数
  const exchangeCards = async (cardIds: number[]): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socketRef.current.emit('exchangeCards', cardIds, (success, error) => {
        resolve({ success, error });
      });
    });
  };

  // イベントリスナー登録関数
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const on = (event: string, listener: (...args: any[]) => void) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).on(event, listener);
    }
  };

  // イベントリスナー削除関数
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const off = (event: string, listener?: (...args: any[]) => void) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).off(event, listener);
    }
  };

  return {
    socket: socketRef.current,
    connectionState,
    login,
    joinGame,
    playCard,
    exchangeCards,
    on,
    off
  };
};