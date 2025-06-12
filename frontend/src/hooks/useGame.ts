'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { EMOTE_CONFIG, TRICK_CONFIG } from '@/constants/emote';
import type { 
  GameState, 
  PlayerInfo, 
  CardInfo,
  HandData, 
  CardPlayData, 
  TrickResult, 
  HandResult, 
  GameResult,
  ScoreHistoryEntry,
  TrickData,
  EmoteType
} from '@/types';

interface GameHookState {
  gameState: GameState | null;
  isInGame: boolean;
  isLoading: boolean;
  error: string | null;
  validCardIds: number[];
  exchangeDirection?: 'left' | 'right' | 'across' | 'none';
  exchangeProgress?: { exchangedPlayers: number[]; remainingPlayers: number[] };
  scoreHistory: ScoreHistoryEntry[];
  gameResult?: GameResult;
  isGameCompleted: boolean;
  isTrickCompleted: boolean;
  trickCompletedTimeout: NodeJS.Timeout | null;
  pendingTricksUpdate?: TrickData[];
  currentTrickResult?: TrickResult;
  isTieContinuation: boolean;
  playerEmotes: Record<number, { emoteType: EmoteType; isVisible: boolean; timestamp: number }>;
}

export const useGame = (currentPlayer: PlayerInfo | null) => {
  const { socket, joinGame, playCard, exchangeCards, on, off } = useSocket();
  const [gameHookState, setGameHookState] = useState<GameHookState>({
    gameState: null,
    isInGame: false,
    isLoading: false,
    error: null,
    validCardIds: [],
    scoreHistory: [],
    isGameCompleted: false,
    isTrickCompleted: false,
    trickCompletedTimeout: null,
    pendingTricksUpdate: undefined,
    currentTrickResult: undefined,
    isTieContinuation: false,
    playerEmotes: {}
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
          scores: result.gameInfo.scores || {},
          handCards: result.gameInfo.hand ? { [currentPlayer.id]: result.gameInfo.hand } : undefined
        };
        
        setGameHookState({
          gameState,
          isInGame: true,
          isLoading: false,
          error: null,
          validCardIds: [],
          scoreHistory: result.gameInfo.scoreHistory || [],
          isGameCompleted: false,
          isTrickCompleted: false,
          isTieContinuation: false,
          trickCompletedTimeout: null,
          pendingTricksUpdate: undefined,
          currentTrickResult: undefined,
          playerEmotes: {}
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

  // エモート送信
  const sendEmote = useCallback((emoteType: EmoteType) => {
    if (!socket) {
      return;
    }
    socket.emit('sendEmote', emoteType);
  }, [socket]);


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
        
        // トリック完了中はtricksの更新を保留して、ウェイト期間中の表示を維持
        const updatedState = { ...stateUpdate };
        let pendingTricksUpdate = prev.pendingTricksUpdate;
        
        if (prev.isTrickCompleted && stateUpdate.tricks) {
          console.log('Trick completed: preserving current tricks during wait period, storing pending update');
          pendingTricksUpdate = stateUpdate.tricks;
          delete updatedState.tricks;
        }
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            ...updatedState,
            // scoresが既に存在する場合は保持、新しいscoresがあれば更新
            scores: updatedState.scores || prev.gameState.scores || {}
          },
          pendingTricksUpdate
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
            }
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
        
        let clearTrickCompleted = false;
        let isNewTrick = false;
        
        if (currentTrickIndex >= 0) {
          const currentTrick = updatedTricks[currentTrickIndex];
          // 最後のトリックが4枚揃っている場合は新しいトリック
          if (currentTrick.cards && currentTrick.cards.length === 4) {
            isNewTrick = true;
            clearTrickCompleted = true;
          }
        } else {
          // tricksが空の場合も新しいトリック
          isNewTrick = true;
          clearTrickCompleted = true;
        }
        
        if (isNewTrick) {
          // 新しいトリックを作成（新しいトリック開始時はトリック完了状態をクリア）
          updatedTricks.push({
            trickNumber: updatedTricks.length + 1,
            cards: [{
              playerId: playData.playerId,
              card: playData.card
            }],
            winnerId: null,
            points: 0,
            isCompleted: false
          });
        } else {
          // 既存トリックにカード追加
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
        }
        
        // 既存のタイマーをクリア（新しいトリック開始時）
        if (clearTrickCompleted && prev.trickCompletedTimeout) {
          clearTimeout(prev.trickCompletedTimeout);
        }
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            tricks: updatedTricks
          },
          isTrickCompleted: clearTrickCompleted ? false : prev.isTrickCompleted,
          trickCompletedTimeout: clearTrickCompleted ? null : prev.trickCompletedTimeout,
          pendingTricksUpdate: clearTrickCompleted ? undefined : prev.pendingTricksUpdate,
          currentTrickResult: clearTrickCompleted ? undefined : prev.currentTrickResult
        };
      });
    };

    // トリック完了
    const handleTrickCompleted = (trickResult: TrickResult) => {
      console.log('Trick completed:', trickResult);
      
      setGameHookState(prev => {
        // 既存のタイマーがあればクリア
        if (prev.trickCompletedTimeout) {
          clearTimeout(prev.trickCompletedTimeout);
        }
        
        // 新しいタイマーを設定（定数で定義された時間後にトリック完了状態をクリア）
        const timeout = setTimeout(() => {
          setGameHookState(current => {
            const newState = {
              ...current,
              isTrickCompleted: false,
              trickCompletedTimeout: null,
              pendingTricksUpdate: undefined,
              currentTrickResult: undefined
            };
            
            // 保留されていたtricks更新があれば適用
            if (current.pendingTricksUpdate && current.gameState) {
              console.log('Trick wait period ended: applying pending tricks update');
              newState.gameState = {
                ...current.gameState,
                tricks: current.pendingTricksUpdate
              };
            }
            
            return newState;
          });
        }, TRICK_CONFIG.DISPLAY_DURATION_MS);
        
        return {
          ...prev,
          isTrickCompleted: true,
          trickCompletedTimeout: timeout,
          currentTrickResult: trickResult
        };
      });
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
      
      // ゲーム状態のスコアも更新
      setGameHookState(prev => {
        if (!prev.gameState) return prev;
        
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            scores: handResult.cumulativeScores || prev.gameState.scores || {},
            currentHandScores: {}  // ハンド完了時に現在ハンドスコアをリセット
          }
        };
      });
    };

    // スコア履歴更新
    const handleScoreHistoryUpdate = (scoreHistory: ScoreHistoryEntry[]) => {
      console.log('Score history updated:', scoreHistory);
      setGameHookState(prev => ({
        ...prev,
        scoreHistory
      }));
    };

    // エモート受信
    const handleReceiveEmote = (data: { fromPlayerId: number; emoteType: EmoteType }) => {
      const currentTimestamp = Date.now();
      setGameHookState(prev => ({
        ...prev,
        playerEmotes: {
          ...prev.playerEmotes,
          [data.fromPlayerId]: {
            emoteType: data.emoteType,
            isVisible: true,
            timestamp: currentTimestamp
          }
        }
      }));

      // 定数で定義された時間後に非表示にする
      setTimeout(() => {
        setGameHookState(prev => ({
          ...prev,
          playerEmotes: {
            ...prev.playerEmotes,
            [data.fromPlayerId]: {
              ...prev.playerEmotes[data.fromPlayerId],
              isVisible: false
            }
          }
        }));
      }, EMOTE_CONFIG.DISPLAY_DURATION_MS);
    };

    // ゲーム完了
    const handleGameCompleted = (gameResult: GameResult) => {
      console.log('Game completed:', gameResult);
      
      // 同点継続の判定: winnerIdがnullの場合は同点継続
      const isTieContinuation = gameResult.winnerId === null;
      
      setGameHookState(prev => ({
        ...prev,
        gameResult: isTieContinuation ? undefined : gameResult, // 同点時はgameResultをundefinedに
        isGameCompleted: !isTieContinuation, // 同点時はfalse、勝者確定時はtrue
        isTieContinuation, // 同点継続フラグを追加
        // isInGameはtrueのままにしてGameBoardを表示し続ける
      }));
    };

    // 同点継続
    const handleGameContinuedFromTie = (tieResult: { message: string; finalScores: Record<number, number>; gameId: number; completedAt: string }) => {
      console.log('Game continued from tie:', tieResult);
      
      setGameHookState(prev => ({
        ...prev,
        gameResult: undefined, // 同点継続時はgameResultはundefined
        isGameCompleted: false, // ゲーム終了モーダルは表示しない
        isTieContinuation: true, // 同点継続フラグをtrue
        // isInGameはtrueのままにしてGameBoardを表示し続ける
      }));
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
    on('scoreHistoryUpdate', handleScoreHistoryUpdate);
    on('gameCompleted', handleGameCompleted);
    on('gameContinuedFromTie', handleGameContinuedFromTie);
    on('receiveEmote', handleReceiveEmote);
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
      off('scoreHistoryUpdate', handleScoreHistoryUpdate);
      off('gameCompleted', handleGameCompleted);
      off('gameContinuedFromTie', handleGameContinuedFromTie);
      off('receiveEmote', handleReceiveEmote);
      off('error', handleError);
    };
  }, [socket, on, off, currentPlayer]);

  // ゲーム終了モーダルを閉じる
  const closeGameEndModal = useCallback(() => {
    setGameHookState(prev => ({
      ...prev,
      isGameCompleted: false,
      gameResult: undefined,
      isTieContinuation: false,
      isInGame: false  // モーダルを閉じた時にゲームから退出
    }));
  }, []);

  return {
    gameState: gameHookState.gameState,
    isInGame: gameHookState.isInGame,
    isLoading: gameHookState.isLoading,
    error: gameHookState.error,
    validCardIds: gameHookState.validCardIds,
    exchangeDirection: gameHookState.exchangeDirection,
    exchangeProgress: gameHookState.exchangeProgress,
    scoreHistory: gameHookState.scoreHistory,
    gameResult: gameHookState.gameResult,
    isGameCompleted: gameHookState.isGameCompleted,
    isTrickCompleted: gameHookState.isTrickCompleted,
    currentTrickResult: gameHookState.currentTrickResult,
    isTieContinuation: gameHookState.isTieContinuation,
    playerEmotes: gameHookState.playerEmotes,
    joinGame: handleJoinGame,
    playCard: handleCardPlay,
    exchangeCards: handleCardExchange,
    updateValidCards,
    sendEmote,
    closeGameEndModal
  };
};