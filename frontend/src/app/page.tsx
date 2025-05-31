'use client';

import React, { useState } from 'react';
import { PlayerSelect } from '@/components/ui/PlayerSelect';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { GameLobby } from '@/components/ui/GameLobby';
import { GameBoard } from '@/components/game/GameBoard';
import { useSocket } from '@/hooks/useSocket';
import { useGame } from '@/hooks/useGame';
import type { LoginState } from '@/types';

export default function Home() {
  const { connectionState, login } = useSocket();
  const [loginState, setLoginState] = useState<LoginState>({
    isLoggedIn: false,
    isLoading: false
  });

  const { 
    gameState, 
    isInGame, 
    isLoading: gameLoading, 
    error: gameError,
    joinGame,
    playCard,
    exchangeCards
  } = useGame(loginState.playerInfo || null);

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

  // ログイン前の画面
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

  // ゲーム参加前のロビー画面
  if (!isInGame && loginState.playerInfo) {
    return (
      <>
        <ConnectionStatus connectionState={connectionState} />
        <GameLobby
          currentPlayer={loginState.playerInfo}
          onJoinGame={joinGame}
          isLoading={gameLoading}
          error={gameError || undefined}
        />
      </>
    );
  }

  // ゲーム画面
  if (isInGame && gameState && loginState.playerInfo) {
    return (
      <>
        <ConnectionStatus connectionState={connectionState} />
        <GameBoard
          gameState={gameState}
          currentPlayerId={loginState.playerInfo.id}
          onCardPlay={playCard}
          onCardExchange={exchangeCards}
        />
      </>
    );
  }

  // フォールバック（ロード中など）
  return (
    <div className="min-h-screen bg-green-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>読み込み中...</p>
      </div>
    </div>
  );
}