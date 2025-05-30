'use client';

import React, { useState } from 'react';
import { PlayerSelect } from '@/components/ui/PlayerSelect';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { useSocket } from '@/hooks/useSocket';
import type { LoginState } from '@/types';

export default function Home() {
  const { connectionState, login } = useSocket();
  const [loginState, setLoginState] = useState<LoginState>({
    isLoggedIn: false,
    isLoading: false
  });

  const handlePlayerSelect = async (playerName: string) => {
    setLoginState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const result = await login(playerName);
      
      if (result.success && result.playerInfo) {
        setLoginState({
          isLoggedIn: true,
          playerInfo: result.playerInfo,
          isLoading: false
        });
      } else {
        setLoginState({
          isLoggedIn: false,
          isLoading: false,
          error: result.error || 'ログインに失敗しました'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginState({
        isLoggedIn: false,
        isLoading: false,
        error: '接続エラーが発生しました'
      });
    }
  };

  if (!loginState.isLoggedIn) {
    return (
      <>
        <ConnectionStatus connectionState={connectionState} />
        <PlayerSelect 
          onPlayerSelect={handlePlayerSelect}
          isLoading={loginState.isLoading || !connectionState.isConnected}
          error={loginState.error || (!connectionState.isConnected ? connectionState.error : undefined)}
        />
      </>
    );
  }

  // ログイン成功後の画面（後で実装）
  return (
    <div className="min-h-screen bg-green-900 text-white">
      <ConnectionStatus connectionState={connectionState} />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">ハーツゲーム</h1>
        <div className="bg-white/10 rounded-lg p-6">
          <h2 className="text-xl mb-2">ようこそ、{loginState.playerInfo?.displayName}さん！</h2>
          <p>ゲーム画面はこれから実装予定です。</p>
          <div className="mt-4 p-4 bg-green-800 rounded">
            <h3 className="font-semibold mb-2">接続状態:</h3>
            <p>サーバー接続: {connectionState.isConnected ? '✅ 接続中' : '❌ 切断'}</p>
            <p>プレイヤー: {loginState.playerInfo?.name} (ID: {loginState.playerInfo?.id})</p>
          </div>
        </div>
      </div>
    </div>
  );
}