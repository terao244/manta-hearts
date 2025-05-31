'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import type { 
  GameState, 
  PlayerInfo, 
  CardInfo,
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
  validCardIds: number[];
  exchangeDirection?: 'left' | 'right' | 'across' | 'none';
  exchangeProgress?: { exchangedPlayers: number[]; remainingPlayers: number[] };
}

export const useGame = (currentPlayer: PlayerInfo | null) => {
  const { socket, joinGame, playCard, exchangeCards, on, off } = useSocket();
  const [gameHookState, setGameHookState] = useState<GameHookState>({
    gameState: null,
    isInGame: false,
    isLoading: false,
    error: null,
    validCardIds: []
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
          error: null,
          validCardIds: []
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

  // 有効カード取得
  const updateValidCards = useCallback(() => {
    if (!socket || !currentPlayer) return;
    
    socket.emit('getValidCards', (validCardIds: number[]) => {
      setGameHookState(prev => ({
        ...prev,
        validCardIds
      }));
    });
  }, [socket, currentPlayer]);

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

    // ゲーム状態変更
    const handleGameStateChanged = (stateUpdate: Partial<GameState>) => {
      console.log('Game state changed:', stateUpdate);
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            ...stateUpdate
          }
        };
      });
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
      
      setGameHookState(prev => ({
        ...prev,
        isInGame: true, // ハンド開始でゲームに参加状態にする
        error: null
      }));
    };

    // カード配布
    const handleCardsDealt = (cards: CardInfo[]) => {
      console.log('Cards dealt:', cards);
      if (!currentPlayer) return;
      
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            handCards: {
              ...prev.gameState.handCards,
              [currentPlayer.id]: cards
            },
            phase: 'exchanging' as const
          },
          isInGame: true, // カード配布でゲームに参加状態にする
          error: null
        };
      });
    };

    // 交換フェーズ開始
    const handleExchangePhaseStarted = (direction: 'left' | 'right' | 'across' | 'none') => {
      console.log('Exchange phase started:', direction);
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            phase: 'exchanging' as const
          },
          exchangeDirection: direction
        };
      });
    };

    // 交換進捗更新
    const handleExchangeProgress = (progress: { exchangedPlayers: number[]; remainingPlayers: number[] }) => {
      console.log('Exchange progress:', progress);
      setGameHookState(prev => ({
        ...prev,
        exchangeProgress: progress
      }));
    };

    // プレイングフェーズ開始
    const handlePlayingPhaseStarted = (leadPlayerId: number) => {
      console.log('Playing phase started, lead player:', leadPlayerId);
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            phase: 'playing' as const,
            currentTurn: leadPlayerId
          },
          exchangeProgress: undefined // プレイングフェーズ開始時に交換進捗をクリア
        };
      });
    };

    // 手札更新
    const handleHandUpdated = (cards: CardInfo[]) => {
      console.log('Hand updated:', cards);
      if (!currentPlayer) return;
      
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            handCards: {
              ...prev.gameState.handCards,
              [currentPlayer.id]: cards
            }
          }
        };
      });
    };

    // カードプレイ
    const handleCardPlayed = (playData: CardPlayData) => {
      console.log('Card played:', playData);
      
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        // 現在のトリックを更新
        const updatedTricks = [...prev.gameState.tricks];
        const currentTrickIndex = updatedTricks.length - 1;
        
        if (currentTrickIndex >= 0) {
          const currentTrick = updatedTricks[currentTrickIndex];
          const updatedCards = [...(currentTrick.cards || [])];
          
          // プレイされたカードを追加
          updatedCards.push({
            playerId: playData.playerId,
            card: playData.card
          });
          
          updatedTricks[currentTrickIndex] = {
            ...currentTrick,
            cards: updatedCards
          };
        } else {
          // 新しいトリックを作成
          updatedTricks.push({
            trickNumber: 1,
            cards: [{
              playerId: playData.playerId,
              card: playData.card
            }],
            winnerId: null,
            points: 0,
            isCompleted: false
          });
        }
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            tricks: updatedTricks
          }
        };
      });
    };

    // トリック完了
    const handleTrickCompleted = (trickResult: TrickResult) => {
      console.log('Trick completed:', trickResult);
    };

    // ハンドスコア更新
    const handleHandScoreUpdate = (currentHandScores: Record<number, number>) => {
      console.log('Hand scores updated:', currentHandScores);
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            currentHandScores
          }
        };
      });
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
    on('gameStateChanged', handleGameStateChanged);
    on('playerJoined', handlePlayerJoined);
    on('playerLeft', handlePlayerLeft);
    on('gameStarted', handleGameStarted);
    on('handStarted', handleHandStarted);
    on('cardsDealt', handleCardsDealt);
    on('handUpdated', handleHandUpdated);
    on('exchangePhaseStarted', handleExchangePhaseStarted);
    on('exchangeProgress', handleExchangeProgress);
    on('playingPhaseStarted', handlePlayingPhaseStarted);
    on('cardPlayed', handleCardPlayed);
    on('trickCompleted', handleTrickCompleted);
    on('handScoreUpdate', handleHandScoreUpdate);
    on('handCompleted', handleHandCompleted);
    on('gameCompleted', handleGameCompleted);
    on('error', handleError);

    // クリーンアップ
    return () => {
      off('gameState', handleGameState);
      off('gameStateChanged', handleGameStateChanged);
      off('playerJoined', handlePlayerJoined);
      off('playerLeft', handlePlayerLeft);
      off('gameStarted', handleGameStarted);
      off('handStarted', handleHandStarted);
      off('cardsDealt', handleCardsDealt);
      off('handUpdated', handleHandUpdated);
      off('exchangePhaseStarted', handleExchangePhaseStarted);
      off('exchangeProgress', handleExchangeProgress);
      off('playingPhaseStarted', handlePlayingPhaseStarted);
      off('cardPlayed', handleCardPlayed);
      off('trickCompleted', handleTrickCompleted);
      off('handScoreUpdate', handleHandScoreUpdate);
      off('handCompleted', handleHandCompleted);
      off('gameCompleted', handleGameCompleted);
      off('error', handleError);
    };
  }, [socket, on, off, currentPlayer]);

  return {
    gameState: gameHookState.gameState,
    isInGame: gameHookState.isInGame,
    isLoading: gameHookState.isLoading,
    error: gameHookState.error,
    validCardIds: gameHookState.validCardIds,
    exchangeDirection: gameHookState.exchangeDirection,
    exchangeProgress: gameHookState.exchangeProgress,
    joinGame: handleJoinGame,
    playCard: handleCardPlay,
    exchangeCards: handleCardExchange,
    updateValidCards
  };
};