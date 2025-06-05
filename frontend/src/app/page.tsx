'use client';

import React, { useState, useEffect } from 'react';
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
  const [shouldAutoJoin, setShouldAutoJoin] = useState(false);

  const { 
    gameState, 
    isInGame, 
    isLoading: gameLoading, 
    error: gameError,
    validCardIds,
    exchangeDirection,
    exchangeProgress,
    scoreHistory,
    gameResult,
    isGameCompleted,
    joinGame,
    playCard,
    exchangeCards,
    updateValidCards,
    closeGameEndModal
  } = useGame(loginState.playerInfo || null);

  // ゲーム状態が変わったときに有効カードを更新
  useEffect(() => {
    if (isInGame && gameState && gameState.phase === 'playing' && gameState.currentTurn === loginState.playerInfo?.id) {
      updateValidCards();
    }
  }, [isInGame, gameState, updateValidCards, loginState.playerInfo?.id]);

  // 自動ゲーム参加処理
  useEffect(() => {
    if (shouldAutoJoin && loginState.isLoggedIn && loginState.playerInfo && !isInGame) {
      console.log('Auto-joining game for player:', loginState.playerInfo);
      setShouldAutoJoin(false); // フラグをリセット
      
      const autoJoin = async () => {
        try {
          await joinGame();
          console.log('Auto join successful');
        } catch (joinError) {
          console.error('Auto join game error:', joinError);
          // エラーが発生した場合、フォールバックとしてロビー画面が表示される
        }
      };
      
      autoJoin();
    }
  }, [shouldAutoJoin, loginState.isLoggedIn, loginState.playerInfo, isInGame, joinGame]);

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
        
        // 自動参加フラグを設定（useEffectで実際のゲーム参加が実行される）
        setShouldAutoJoin(true);
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

  // ゲーム参加前の状態（自動参加中またはエラー時のみロビー表示）
  if (!isInGame && loginState.playerInfo) {
    // ゲーム参加にエラーがある場合のみロビー画面を表示
    if (gameError) {
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
    
    // 通常は自動参加中の読み込み画面を表示
    return (
      <>
        <ConnectionStatus connectionState={connectionState} />
        <div className="min-h-screen bg-green-900 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg mb-2">ゲームに参加中...</p>
            <p className="text-sm text-gray-300">4人のプレイヤーが揃うまでお待ちください</p>
          </div>
        </div>
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
          validCardIds={validCardIds}
          exchangeDirection={exchangeDirection}
          exchangeProgress={exchangeProgress}
          scoreHistory={scoreHistory}
          gameResult={gameResult}
          isGameCompleted={isGameCompleted}
          onCardPlay={playCard}
          onCardExchange={exchangeCards}
          onCloseGameEndModal={closeGameEndModal}
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