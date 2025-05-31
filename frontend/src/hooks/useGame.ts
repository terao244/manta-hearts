'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import type { 
  GameState, 
  GameInfo,
  PlayerInfo, 
  HandData, 
  CardPlayData, 
  TrickResult, 
  HandResult, 
  GameResult 
} from '@/types';

interface GameHookState {
  gameState: GameState | null;
  isInGame: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useGame = (currentPlayer: PlayerInfo | null) => {
  const { socket, joinGame, playCard, exchangeCards, on, off } = useSocket();
  const [gameHookState, setGameHookState] = useState<GameHookState>({
    gameState: null,
    isInGame: false,
    isLoading: false,
    error: null
  });

  // ゲーム参加
  const handleJoinGame = useCallback(async () => {
    if (!currentPlayer) return;

    setGameHookState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await joinGame();
      
      if (result.success && result.gameInfo) {
        // GameInfoをGameStateに変換
        const gameState: GameState = {
          gameId: result.gameInfo.gameId,
          status: result.gameInfo.status as 'PLAYING' | 'FINISHED' | 'PAUSED' | 'ABANDONED',
          players: result.gameInfo.players.map(p => ({
            id: p.id,
            name: p.name,
            displayName: p.name, // TODO: displayNameがGameInfoにない場合の対応
            displayOrder: 0, // TODO: 適切な値を設定
            isActive: true
          })),
          phase: result.gameInfo.phase as 'waiting' | 'dealing' | 'exchanging' | 'playing' | 'completed',
          currentTurn: result.gameInfo.currentTurn,
          heartsBroken: result.gameInfo.heartsBroken,
          tricks: result.gameInfo.tricks || [],
          scores: result.gameInfo.scores,
          handCards: result.gameInfo.hand ? { [currentPlayer.id]: result.gameInfo.hand } : undefined
        };
        
        setGameHookState({
          gameState,
          isInGame: true,
          isLoading: false,
          error: null
        });
      } else {
        setGameHookState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'ゲーム参加に失敗しました'
        }));
      }
    } catch (error) {
      console.error('Join game error:', error);
      setGameHookState(prev => ({
        ...prev,
        isLoading: false,
        error: 'ゲーム参加中にエラーが発生しました'
      }));
    }
  }, [currentPlayer, joinGame]);

  // カードプレイ
  const handleCardPlay = useCallback(async (cardId: number) => {
    try {
      const result = await playCard(cardId);
      if (!result.success) {
        setGameHookState(prev => ({
          ...prev,
          error: result.error || 'カードのプレイに失敗しました'
        }));
      }
    } catch (error) {
      console.error('Play card error:', error);
      setGameHookState(prev => ({
        ...prev,
        error: 'カードプレイ中にエラーが発生しました'
      }));
    }
  }, [playCard]);

  // カード交換
  const handleCardExchange = useCallback(async (cardIds: number[]) => {
    try {
      const result = await exchangeCards(cardIds);
      if (!result.success) {
        setGameHookState(prev => ({
          ...prev,
          error: result.error || 'カード交換に失敗しました'
        }));
      }
    } catch (error) {
      console.error('Exchange cards error:', error);
      setGameHookState(prev => ({
        ...prev,
        error: 'カード交換中にエラーが発生しました'
      }));
    }
  }, [exchangeCards]);

  // Socket.ioイベントリスナー
  useEffect(() => {
    if (!socket) return;

    // ゲーム状態更新
    const handleGameState = (gameState: GameState) => {
      console.log('Game state updated:', gameState);
      setGameHookState(prev => ({
        ...prev,
        gameState,
        isInGame: true,
        error: null
      }));
    };

    // プレイヤー参加
    const handlePlayerJoined = (playerInfo: PlayerInfo | number) => {
      console.log('Player joined:', playerInfo);
      
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        // playerInfoが数値の場合は、PlayerInfoオブジェクトを作成
        let playerObject: PlayerInfo;
        if (typeof playerInfo === 'number') {
          playerObject = {
            id: playerInfo,
            name: `Player ${playerInfo}`,
            displayName: `Player ${playerInfo}`,
            displayOrder: playerInfo,
            isActive: true
          };
        } else {
          playerObject = playerInfo;
        }
        
        const updatedPlayers = [...prev.gameState.players];
        const existingIndex = updatedPlayers.findIndex(p => p.id === playerObject.id);
        
        if (existingIndex >= 0) {
          updatedPlayers[existingIndex] = playerObject;
        } else {
          updatedPlayers.push(playerObject);
        }


        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            players: updatedPlayers
          }
        };
      });
    };

    // プレイヤー離脱
    const handlePlayerLeft = (playerId: number) => {
      console.log('Player left:', playerId);
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            players: prev.gameState.players.filter(p => p.id !== playerId)
          }
        };
      });
    };

    // ゲーム開始
    const handleGameStarted = (gameId: number) => {
      console.log('Game started:', gameId);
      setGameHookState(prev => ({
        ...prev,
        error: null
      }));
    };

    // ハンド開始
    const handleHandStarted = (handData: HandData) => {
      console.log('Hand started:', handData);
    };

    // カードプレイ
    const handleCardPlayed = (playData: CardPlayData) => {
      console.log('Card played:', playData);
    };

    // トリック完了
    const handleTrickCompleted = (trickResult: TrickResult) => {
      console.log('Trick completed:', trickResult);
    };

    // ハンド完了
    const handleHandCompleted = (handResult: HandResult) => {
      console.log('Hand completed:', handResult);
    };

    // ゲーム完了
    const handleGameCompleted = (gameResult: GameResult) => {
      console.log('Game completed:', gameResult);
    };

    // エラー
    const handleError = (error: string) => {
      console.error('Socket error:', error);
      setGameHookState(prev => ({
        ...prev,
        error
      }));
    };

    // イベントリスナー登録
    on('gameState', handleGameState);
    on('playerJoined', handlePlayerJoined);
    on('playerLeft', handlePlayerLeft);
    on('gameStarted', handleGameStarted);
    on('handStarted', handleHandStarted);
    on('cardPlayed', handleCardPlayed);
    on('trickCompleted', handleTrickCompleted);
    on('handCompleted', handleHandCompleted);
    on('gameCompleted', handleGameCompleted);
    on('error', handleError);

    // クリーンアップ
    return () => {
      off('gameState', handleGameState);
      off('playerJoined', handlePlayerJoined);
      off('playerLeft', handlePlayerLeft);
      off('gameStarted', handleGameStarted);
      off('handStarted', handleHandStarted);
      off('cardPlayed', handleCardPlayed);
      off('trickCompleted', handleTrickCompleted);
      off('handCompleted', handleHandCompleted);
      off('gameCompleted', handleGameCompleted);
      off('error', handleError);
    };
  }, [socket, on, off]);

  return {
    gameState: gameHookState.gameState,
    isInGame: gameHookState.isInGame,
    isLoading: gameHookState.isLoading,
    error: gameHookState.error,
    joinGame: handleJoinGame,
    playCard: handleCardPlay,
    exchangeCards: handleCardExchange
  };
};