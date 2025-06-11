'use client';

import React, { useState, useEffect } from 'react';
import { Hand } from './Hand';
import { Card } from './Card';
import { ScoreGraph } from './ScoreGraph';
import GameEndModal from './GameEndModal';
import EmoteButtons from './EmoteButtons';
import EmoteBubble from './EmoteBubble';
import type { GameBoardProps, CardInfo, PlayerInfo, RelativePosition, EmoteType } from '@/types';

// プレイヤーカードコンポーネント
interface PlayerCardProps {
  player: PlayerInfo;
  currentPlayerId?: number;
  currentTurn?: number;
  scores?: Record<number, number>;
  currentHandScores?: Record<number, number>;
  isTied?: boolean;
  emoteType?: EmoteType;
  isEmoteVisible?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, currentPlayerId, currentTurn, scores = {}, currentHandScores = {}, isTied = false, emoteType, isEmoteVisible = false }) => {
  const isCurrentPlayer = player.id === currentPlayerId;
  const isCurrentTurn = player.id === currentTurn;
  const currentHandScore = currentHandScores[player.id] || 0;
  const cumulativeScore = scores[player.id] || 0;


  return (
    <div className="relative">
      <div
        className={`
          px-3 py-2 bg-white rounded-lg shadow-md border-2 transition-all min-w-28 text-center transform
          ${isCurrentPlayer ? 'ring-2 ring-blue-500 border-blue-300 scale-105' : 'border-gray-200'}
          ${isCurrentTurn && !isCurrentPlayer ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-400 scale-110 animate-pulse' : ''}
          ${isCurrentTurn && isCurrentPlayer ? 'bg-green-50 border-green-300 ring-2 ring-green-400 scale-110 animate-pulse' : ''}
        `}
      >
        <div className={`text-sm font-semibold mb-1 ${isCurrentTurn ? 'text-yellow-800' : 'text-gray-800'
          }`}>
          {player.displayName}
        </div>
        <div 
          className={`text-sm font-bold ${isCurrentTurn ? 'text-yellow-600' : 'text-green-600'
          }`}
          data-testid={isTied ? 'tied-score' : undefined}
        >
          {cumulativeScore}点 / +{currentHandScore}点
          {isTied && <span className="ml-1 text-red-500">🟰</span>}
        </div>
        {isCurrentTurn && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
      {emoteType && (
        <EmoteBubble 
          emoteType={emoteType} 
          isVisible={isEmoteVisible}
        />
      )}
    </div>
  );
};

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentPlayerId,
  validCardIds = [],
  exchangeDirection,
  exchangeProgress,
  scoreHistory = [],
  showScoreGraph = false,
  gameResult,
  isGameCompleted = false,
  isTrickCompleted = false,
  currentTrickResult,
  isTieContinuation = false,
  playerEmotes = {},
  onCardPlay,
  onCardExchange,
  onCloseGameEndModal,
  socket
}) => {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isScoreGraphVisible, setIsScoreGraphVisible] = useState<boolean>(showScoreGraph);
  

  // 同点プレイヤーの判定
  const getTiedPlayerIds = () => {
    if (!isTieContinuation || !gameState.scores) return new Set<number>();
    
    const scores = Object.values(gameState.scores);
    const minScore = Math.min(...scores);
    const tiedPlayerIds = new Set<number>();
    
    Object.entries(gameState.scores).forEach(([playerId, score]) => {
      if (score === minScore) {
        tiedPlayerIds.add(Number(playerId));
      }
    });
    
    return tiedPlayerIds.size > 1 ? tiedPlayerIds : new Set<number>();
  };

  const tiedPlayerIds = getTiedPlayerIds();


  const {
    gameId,
    status,
    players,
    currentHand = 0,
    currentTrick = 0,
    currentTurn,
    phase,
    heartsBroken,
    tricks,
    scores = {},
    currentHandScores = {},
    handCards
  } = gameState;

  const currentPlayerCards = currentPlayerId ? handCards?.[currentPlayerId] || [] : [];

  const getCurrentTrickCards = () => {
    if (tricks.length === 0) return [];
    const currentTrick = tricks[tricks.length - 1];
    const currentTrickCards = currentTrick.cards || [];
    
    // トリック完了中は現在のトリックカードを表示し続ける
    if (isTrickCompleted && currentTrickCards.length === 4) {
      return currentTrickCards;
    }
    
    // トリック完了状態でない場合、または4枚未満の場合は通常通り
    return currentTrickCards;
  };


  const handleCardSelect = (card: CardInfo) => {
    if (phase !== 'exchanging') return;

    setSelectedCards(prev => {
      if (prev.includes(card.id)) {
        return prev.filter(id => id !== card.id);
      } else if (prev.length < 3) {
        return [...prev, card.id];
      } else {
        return prev;
      }
    });
  };

  const handleCardPlay = (card: CardInfo) => {
    if (phase !== 'playing') return;
    onCardPlay(card.id);
  };

  const handleExchangeConfirm = () => {
    if (selectedCards.length === 3) {
      onCardExchange(selectedCards);
      setSelectedCards([]);
    }
  };

  const handleExchangeCancel = () => {
    setSelectedCards([]);
  };

  const getExchangeDirectionText = (): string => {
    switch (exchangeDirection) {
      case 'left':
        return '左隣のプレイヤーと交換';
      case 'right':
        return '右隣のプレイヤーと交換';
      case 'across':
        return '向かいのプレイヤーと交換';
      case 'none':
        return '交換なし（このハンド）';
      default:
        return '';
    }
  };

  const getExchangeDirectionIcon = (): string => {
    switch (exchangeDirection) {
      case 'left':
        return '⬅️';
      case 'right':
        return '➡️';
      case 'across':
        return '⬆️';
      case 'none':
        return '🚫';
      default:
        return '';
    }
  };

  const getPlayerPosition = (playerId: number): RelativePosition | '' => {
    if (!currentPlayerId) return '';

    const player = players.find(p => p.id === playerId);
    const currentPlayer = players.find(p => p.id === currentPlayerId);

    if (!player?.position || !currentPlayer?.position) {
      // positionが設定されていない場合は従来のロジックを使用
      const positions: RelativePosition[] = ['bottom', 'left', 'top', 'right'];
      const currentIndex = players.findIndex(p => p.id === currentPlayerId);
      const playerIndex = players.findIndex(p => p.id === playerId);
      const relativeIndex = (playerIndex - currentIndex + 4) % 4;
      return positions[relativeIndex];
    }

    // 現在のプレイヤーを基準とした相対位置を計算
    const currentPlayerPosition = currentPlayer.position;
    const targetPlayerPosition = player.position;

    // 現在のプレイヤーが常に下側（bottom）になるよう配置
    if (playerId === currentPlayerId) {
      return 'bottom';
    }

    // North, East, South, Westの順序で配置
    const positionOrder = ['North', 'East', 'South', 'West'];
    const currentIndex = positionOrder.indexOf(currentPlayerPosition);
    const targetIndex = positionOrder.indexOf(targetPlayerPosition);

    // 相対位置を計算
    const relativeIndex = (targetIndex - currentIndex + 4) % 4;
    const relativePositions: RelativePosition[] = ['bottom', 'left', 'top', 'right'];

    return relativePositions[relativeIndex];
  };

  const getTrickCardPosition = (playerId: number): string => {
    const position = getPlayerPosition(playerId);
    switch (position) {
      case 'top':
        return 'absolute top-2 left-1/2 transform -translate-x-1/2';
      case 'right':
        return 'absolute right-2 top-1/2 transform -translate-y-1/2';
      case 'bottom':
        return 'absolute bottom-2 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'absolute left-2 top-1/2 transform -translate-y-1/2';
      default:
        return 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }
  };

  const getTrickWinner = (): number | null => {
    // トリック完了中は、currentTrickResultのwinnerIdを優先使用
    if (isTrickCompleted && currentTrickResult) {
      return currentTrickResult.winnerId;
    }
    
    // 通常時は既存のロジック
    if (tricks.length === 0) return null;
    const currentTrick = tricks[tricks.length - 1];
    return currentTrick.winnerId || null;
  };

  const getWinnerDirection = (winnerId: number): string => {
    const winnerPosition = getPlayerPosition(winnerId);
    switch (winnerPosition) {
      case 'top':
        return 'card-collect-to-top';
      case 'right':
        return 'card-collect-to-right';
      case 'bottom':
        return 'card-collect-to-bottom';
      case 'left':
        return 'card-collect-to-left';
      default:
        return '';
    }
  };

  const getPhaseMessage = (): string => {
    switch (phase) {
      case 'waiting':
        return '他のプレイヤーを待っています...';
      case 'dealing':
        return 'カードを配っています...';
      case 'exchanging':
        return '交換するカードを3枚選んでください';
      case 'playing':
        return currentTurn === currentPlayerId ? 'あなたの番です' : '他のプレイヤーの番です';
      case 'completed':
        return 'ゲーム終了';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-green-900 text-white">
      {/* ヘッダー */}
      <div className="bg-green-800 p-2 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">ハーツゲーム</h1>
            <div className="text-xs opacity-80">
              ゲーム#{gameId} | ハンド: {currentHand} | トリック: {currentTrick}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-3 mb-1">
              <div className={`text-xs ${phase === 'playing' && currentTurn === currentPlayerId
                ? 'text-yellow-300 font-bold animate-pulse'
                : ''
                }`}>
                {status === 'FINISHED' ? 'ゲーム終了' : getPhaseMessage()}
                {phase === 'playing' && currentTurn === currentPlayerId && (
                  <span className="ml-1 text-yellow-400">👆</span>
                )}
              </div>
              <button
                onClick={() => setIsScoreGraphVisible(!isScoreGraphVisible)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                title={isScoreGraphVisible ? 'グラフを非表示' : 'グラフを表示'}
              >
                {isScoreGraphVisible ? '📊→📋' : '📋→📊'}
              </button>
            </div>
            {phase === 'exchanging' && exchangeDirection && (
              <div className="text-yellow-300 text-xs font-semibold flex items-center justify-end gap-1 mt-0.5">
                <span>{getExchangeDirectionIcon()}</span>
                <span>{getExchangeDirectionText()}</span>
              </div>
            )}
            {phase === 'exchanging' && exchangeProgress && (
              <div className="text-blue-300 text-xs mt-0.5 text-right">
                {exchangeProgress.exchangedPlayers.length === 4 ? (
                  <span className="text-green-400 animate-pulse font-bold">
                    🎉 全員交換完了！プレイ開始準備中...
                  </span>
                ) : (
                  <>
                    <span className="text-blue-300">
                      交換完了: {exchangeProgress.exchangedPlayers.length}/4人
                    </span>
                    {currentPlayerId && exchangeProgress.exchangedPlayers.includes(currentPlayerId) && (
                      <span className="text-green-400 ml-1">✓ あなた完了</span>
                    )}
                    {exchangeProgress.remainingPlayers.length > 0 && (
                      <span className="text-yellow-300 ml-1">
                        待機中: {exchangeProgress.remainingPlayers.length}人
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
            {heartsBroken && (
              <div className="text-red-400 text-xs font-semibold">
                ハートブレイク中
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        {/* メインコンテンツエリア（ゲームテーブル＋スコアグラフ） */}
        <div className="flex gap-4 justify-center mb-6">
          {/* ゲームテーブルエリア */}
          <div className="relative w-full max-w-5xl">
            {/* 卓配置レイアウト */}
            <div className="relative h-[28rem] bg-green-800 rounded-lg p-5">

              {/* 上のプレイヤー */}
              {players.filter(p => getPlayerPosition(p.id) === 'top').map(player => (
                <div
                  key={player.id}
                  data-testid={`player-${player.id}`}
                  className="absolute top-2 left-1/2 transform -translate-x-1/2"
                >
                  <PlayerCard 
                    player={player} 
                    currentPlayerId={currentPlayerId} 
                    currentTurn={currentTurn} 
                    scores={scores} 
                    currentHandScores={currentHandScores} 
                    isTied={tiedPlayerIds.has(player.id)}
                    emoteType={playerEmotes[player.id]?.emoteType}
                    isEmoteVisible={playerEmotes[player.id]?.isVisible || false}
                  />
                </div>
              ))}

              {/* 右のプレイヤー */}
              {players.filter(p => getPlayerPosition(p.id) === 'right').map(player => (
                <div
                  key={player.id}
                  data-testid={`player-${player.id}`}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <PlayerCard 
                    player={player} 
                    currentPlayerId={currentPlayerId} 
                    currentTurn={currentTurn} 
                    scores={scores} 
                    currentHandScores={currentHandScores} 
                    isTied={tiedPlayerIds.has(player.id)}
                    emoteType={playerEmotes[player.id]?.emoteType}
                    isEmoteVisible={playerEmotes[player.id]?.isVisible || false}
                  />
                </div>
              ))}

              {/* 下のプレイヤー */}
              {players.filter(p => getPlayerPosition(p.id) === 'bottom').map(player => (
                <div key={player.id}>
                  <div
                    data-testid={`player-${player.id}`}
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                  >
                    <PlayerCard 
                      player={player} 
                      currentPlayerId={currentPlayerId} 
                      currentTurn={currentTurn} 
                      scores={scores} 
                      currentHandScores={currentHandScores} 
                      isTied={tiedPlayerIds.has(player.id)}
                      emoteType={playerEmotes[player.id]?.emoteType}
                      isEmoteVisible={playerEmotes[player.id]?.isVisible || false}
                    />
                  </div>
                  {/* 自分のプレイヤーのエモートボタン */}
                  {(() => {
                    const shouldShowEmoteButtons = player.id === currentPlayerId && socket && (phase === 'exchanging' || phase === 'playing');
                    return shouldShowEmoteButtons && (
                      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
                        <EmoteButtons socket={socket} gameState={gameState} />
                      </div>
                    );
                  })()}
                </div>
              ))}

              {/* 左のプレイヤー */}
              {players.filter(p => getPlayerPosition(p.id) === 'left').map(player => (
                <div
                  key={player.id}
                  data-testid={`player-${player.id}`}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2"
                >
                  <PlayerCard 
                    player={player} 
                    currentPlayerId={currentPlayerId} 
                    currentTurn={currentTurn} 
                    scores={scores} 
                    currentHandScores={currentHandScores} 
                    isTied={tiedPlayerIds.has(player.id)}
                    emoteType={playerEmotes[player.id]?.emoteType}
                    isEmoteVisible={playerEmotes[player.id]?.isVisible || false}
                  />
                </div>
              ))}

              {/* 中央エリア（トリック表示） */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  data-testid="trick-area"
                  className="bg-green-700 rounded-lg w-96 h-64 shadow-lg border border-green-600 relative"
                >

                  {/* カード配置領域 */}
                  {getCurrentTrickCards().map((cardPlay, index) => {
                    const cardInfo = cardPlay.card;
                    const winnerId = getTrickWinner();
                    const isCompleted = isTrickCompleted && getCurrentTrickCards().length === 4;
                    
                    // アニメーションクラスを決定
                    let animationClass = '';
                    if (isCompleted && winnerId) {
                      animationClass = `card-collect-animation ${getWinnerDirection(winnerId)}`;
                    }

                    return (
                      <div
                        key={`${cardPlay.playerId}-${cardInfo.id}`}
                        className={`${getTrickCardPosition(cardPlay.playerId)} transform transition-all duration-300 opacity-100 ${animationClass}`}
                        style={{
                          animationDelay: isCompleted ? `${index * 150}ms` : `${index * 200}ms`,
                          animation: isCompleted ? undefined : 'fadeInUp 0.5s ease-out forwards'
                        }}
                      >
                        <Card
                          card={cardInfo}
                          size="medium"
                          isPlayable={true}
                        />
                      </div>
                    );
                  })}

                  {/* 待機中メッセージ */}
                  {getCurrentTrickCards().length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-300 text-sm py-4">
                        プレイを待機中...
                      </div>
                    </div>
                  )}

                  {/* トリック完了メッセージ */}
                  {getCurrentTrickCards().length === 4 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className={`font-bold text-center px-3 py-2 rounded-lg ${
                        isTrickCompleted 
                          ? 'text-green-200 text-lg animate-pulse drop-shadow-lg bg-green-900/80 border border-green-600' 
                          : 'text-yellow-300 text-sm bg-yellow-900/60 border border-yellow-600'
                      }`}>
                        {isTrickCompleted && getTrickWinner() ? (
                          <>
                            <div>トリック完了！</div>
                            <div className="text-sm mt-1">
                              {players.find(p => p.id === getTrickWinner())?.displayName}の勝利
                            </div>
                          </>
                        ) : (
                          'トリック完了！'
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* スコアグラフエリア（右側固定） */}
          {isScoreGraphVisible && (
            <div className="flex-shrink-0 w-96">
              <ScoreGraph
                players={players}
                scoreHistory={scoreHistory}
                currentPlayerId={currentPlayerId}
                height="28rem"
                className="border border-gray-300"
              />
            </div>
          )}
        </div>


        {/* 手札エリア */}
        <div className="bg-white rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-black text-base font-semibold">あなたの手札</h3>
              {phase === 'exchanging' && exchangeDirection && (
                <div className="flex items-center gap-1 text-sm text-purple-600 font-medium">
                  <span>{getExchangeDirectionIcon()}</span>
                  <span>{getExchangeDirectionText()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {phase === 'exchanging' && selectedCards.length === 3 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleExchangeCancel}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleExchangeConfirm}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors shadow-md"
                  >
                    🔄 交換確定
                  </button>
                </div>
              )}
              {(phase === 'exchanging' || phase === 'playing') && (
                <div className="text-sm font-medium text-blue-600">
                  {phase === 'exchanging' ? '交換モード' : 'プレイモード'}
                </div>
              )}
            </div>
          </div>
          {currentPlayerCards.length > 0 ? (
            <Hand
              cards={currentPlayerCards}
              selectedCardIds={selectedCards}
              playableCardIds={validCardIds}
              mode={phase === 'exchanging' ? 'exchange' : phase === 'playing' ? 'play' : 'view'}
              maxSelectableCards={3}
              isExchangeCompleted={
                !!(phase === 'exchanging' &&
                  exchangeProgress &&
                  currentPlayerId &&
                  exchangeProgress.exchangedPlayers.includes(currentPlayerId))
              }
              isPlayerTurn={currentTurn === currentPlayerId}
              onCardSelect={handleCardSelect}
              onCardPlay={handleCardPlay}
            />
          ) : (
            <div className="text-center py-4 text-gray-500">
              手札がありません
            </div>
          )}
        </div>

      </div>

      {/* 同点継続メッセージ */}
      {isTieContinuation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="tie-continuation-message"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <div className="text-2xl mb-4">🔄</div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">同点継続</h2>
            <p className="text-gray-600 mb-6">
              同点のため次のハンドに進みます
            </p>
            <div className="text-sm text-gray-500">
              最低得点者が複数いるため、ゲームを継続します
            </div>
          </div>
        </div>
      )}

      {/* ゲーム終了モーダル（勝者確定時のみ表示） */}
      {isGameCompleted && gameResult && !isTieContinuation && (
        <GameEndModal
          isOpen={isGameCompleted}
          gameResult={gameResult}
          players={players}
          onClose={onCloseGameEndModal || (() => { })}
          data-testid="game-end-modal"
        />
      )}
    </div>
  );
};