'use client';

import React, { useState } from 'react';
import { Hand } from './Hand';
import type { GameBoardProps, CardInfo, PlayerInfo } from '@/types';

// プレイヤーカードコンポーネント
interface PlayerCardProps {
  player: PlayerInfo;
  currentPlayerId?: number;
  currentTurn?: number;
  scores: Record<number, number>;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, currentPlayerId, currentTurn, scores }) => {
  const isCurrentPlayer = player.id === currentPlayerId;
  const isCurrentTurn = player.id === currentTurn;
  
  return (
    <div
      className={`
        p-3 bg-white rounded-lg shadow-md border-2 transition-all min-w-24 text-center transform
        ${isCurrentPlayer ? 'ring-2 ring-blue-500 border-blue-300 scale-105' : 'border-gray-200'}
        ${isCurrentTurn && !isCurrentPlayer ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-400 scale-110 animate-pulse' : ''}
        ${isCurrentTurn && isCurrentPlayer ? 'bg-green-50 border-green-300 ring-2 ring-green-400 scale-110 animate-pulse' : ''}
      `}
    >
      <div className={`text-xs font-semibold ${
        isCurrentTurn ? 'text-yellow-800' : 'text-gray-800'
      }`}>
        {player.displayName}
      </div>
      <div className={`text-lg font-bold ${
        isCurrentTurn ? 'text-yellow-600' : 'text-green-600'
      }`}>
        {scores[player.id] || 0}点
      </div>
      {isCurrentTurn && (
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
          <div className="text-xs text-yellow-600 font-bold">手番</div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
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
  onCardPlay,
  onCardExchange
}) => {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

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
    scores,
    handCards
  } = gameState;

  const currentPlayerCards = currentPlayerId ? handCards?.[currentPlayerId] || [] : [];

  const getCurrentTrickCards = () => {
    if (tricks.length === 0) return [];
    const currentTrick = tricks[tricks.length - 1];
    return currentTrick.cards || [];
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

  const getPlayerPosition = (playerId: number): string => {
    if (!currentPlayerId) return '';
    const positions = ['South', 'West', 'North', 'East'];
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    const playerIndex = players.findIndex(p => p.id === playerId);
    const relativeIndex = (playerIndex - currentIndex + 4) % 4;
    return positions[relativeIndex];
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
      <div className="bg-green-800 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ハーツゲーム</h1>
            <div className="text-sm opacity-80">
              ゲーム#{gameId} | ハンド: {currentHand} | トリック: {currentTrick}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm ${
              phase === 'playing' && currentTurn === currentPlayerId 
                ? 'text-yellow-300 font-bold animate-pulse' 
                : ''
            }`}>
              {status === 'FINISHED' ? 'ゲーム終了' : getPhaseMessage()}
              {phase === 'playing' && currentTurn === currentPlayerId && (
                <span className="ml-2 text-yellow-400">👆</span>
              )}
            </div>
            {phase === 'exchanging' && exchangeDirection && (
              <div className="text-yellow-300 text-sm font-semibold flex items-center justify-end gap-2 mt-1">
                <span>{getExchangeDirectionIcon()}</span>
                <span>{getExchangeDirectionText()}</span>
              </div>
            )}
            {phase === 'exchanging' && exchangeProgress && (
              <div className="text-blue-300 text-xs mt-1 text-right">
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
                      <span className="text-green-400 ml-2">✓ あなた完了</span>
                    )}
                    {exchangeProgress.remainingPlayers.length > 0 && (
                      <span className="text-yellow-300 ml-2">
                        待機中: {exchangeProgress.remainingPlayers.length}人
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
            {heartsBroken && (
              <div className="text-red-400 text-sm font-semibold">
                ハートブレイク中
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        {/* ゲームテーブルエリア */}
        <div className="relative w-full max-w-4xl mx-auto mb-6">
          {/* 卓配置レイアウト */}
          <div className="relative h-96 bg-green-800 rounded-lg p-4">
            
            {/* 北（上）のプレイヤー */}
            {players.filter(p => getPlayerPosition(p.id) === 'North').map(player => (
              <div
                key={player.id}
                data-testid={`player-${player.id}`}
                className="absolute top-2 left-1/2 transform -translate-x-1/2"
              >
                <PlayerCard player={player} currentPlayerId={currentPlayerId} currentTurn={currentTurn} scores={scores} />
              </div>
            ))}

            {/* 東（右）のプレイヤー */}
            {players.filter(p => getPlayerPosition(p.id) === 'East').map(player => (
              <div
                key={player.id}
                data-testid={`player-${player.id}`}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <PlayerCard player={player} currentPlayerId={currentPlayerId} currentTurn={currentTurn} scores={scores} />
              </div>
            ))}

            {/* 南（下）のプレイヤー */}
            {players.filter(p => getPlayerPosition(p.id) === 'South').map(player => (
              <div
                key={player.id}
                data-testid={`player-${player.id}`}
                className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
              >
                <PlayerCard player={player} currentPlayerId={currentPlayerId} currentTurn={currentTurn} scores={scores} />
              </div>
            ))}

            {/* 西（左）のプレイヤー */}
            {players.filter(p => getPlayerPosition(p.id) === 'West').map(player => (
              <div
                key={player.id}
                data-testid={`player-${player.id}`}
                className="absolute left-2 top-1/2 transform -translate-y-1/2"
              >
                <PlayerCard player={player} currentPlayerId={currentPlayerId} currentTurn={currentTurn} scores={scores} />
              </div>
            ))}

            {/* 中央エリア（トリック表示） */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                data-testid="trick-area"
                className="bg-green-700 rounded-lg p-4 w-64 h-40 flex flex-col items-center justify-center shadow-lg border border-green-600"
              >
                <h4 className="text-sm font-semibold mb-3 text-center text-white">
                  トリック {currentTrick}
                  {getCurrentTrickCards().length > 0 && (
                    <span className="ml-2 text-xs text-yellow-300">
                      ({getCurrentTrickCards().length}/4)
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-2 w-full max-w-32">
                  {getCurrentTrickCards().map((cardPlay, index) => {
                    const player = players.find(p => p.id === cardPlay.playerId);
                    const cardInfo = cardPlay.card;
                    
                    return (
                      <div 
                        key={`${cardPlay.playerId}-${cardInfo.id}`} 
                        className="text-center transform transition-all duration-300 hover:scale-105"
                        style={{
                          animationDelay: `${index * 200}ms`,
                          animation: 'fadeInUp 0.5s ease-out forwards'
                        }}
                      >
                        <div className="text-xs mb-1 text-white font-medium">
                          {player?.displayName?.slice(0, 4)}
                        </div>
                        <div className="w-12 h-16 bg-white rounded-md border-2 border-gray-300 flex flex-col items-center justify-center text-black text-xs shadow-md relative">
                          <div className={`text-lg font-bold ${cardInfo.suit === 'HEARTS' || cardInfo.suit === 'DIAMONDS' ? 'text-red-600' : 'text-black'}`}>
                            {cardInfo.suit === 'HEARTS' && '♥'}
                            {cardInfo.suit === 'DIAMONDS' && '♦'}
                            {cardInfo.suit === 'CLUBS' && '♣'}
                            {cardInfo.suit === 'SPADES' && '♠'}
                          </div>
                          <div className="text-xs font-bold">
                            {cardInfo.rank === 'ACE' && 'A'}
                            {cardInfo.rank === 'KING' && 'K'}
                            {cardInfo.rank === 'QUEEN' && 'Q'}
                            {cardInfo.rank === 'JACK' && 'J'}
                            {['TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'].includes(cardInfo.rank) && 
                              ['2', '3', '4', '5', '6', '7', '8', '9', '10'][['TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'].indexOf(cardInfo.rank)]
                            }
                          </div>
                          {cardInfo.pointValue > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                              {cardInfo.pointValue}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {getCurrentTrickCards().length === 0 && (
                    <div className="col-span-2 text-center text-gray-300 text-sm py-4">
                      プレイを待機中...
                    </div>
                  )}
                </div>
                {getCurrentTrickCards().length === 4 && (
                  <div className="mt-2 text-xs text-yellow-300 font-semibold animate-pulse">
                    トリック完了！
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ゲーム情報サイドバー */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* ゲーム状態 */}
          <div className="bg-green-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ゲーム状態</h3>
            <div className="space-y-2 text-sm">
              <div>ゲームID: {gameId}</div>
              <div>フェーズ: {phase}</div>
              <div>ハンド: {currentHand}</div>
              <div>トリック: {currentTrick}</div>
              <div className="font-semibold">{getPhaseMessage()}</div>
            </div>
          </div>

          {/* ゲームルール情報 */}
          <div className="bg-green-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ルール状態</h3>
            <div className="space-y-2 text-sm">
              <div>ハートブレイク: {heartsBroken ? 'はい' : 'いいえ'}</div>
              <div>完了トリック: {tricks.length}</div>
              <div>状態: {status}</div>
            </div>
          </div>

          {/* スコア一覧 */}
          <div className="bg-green-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">スコア</h3>
            <div className="space-y-1 text-sm">
              {players.map(player => (
                <div key={player.id} className="flex justify-between">
                  <span>{player.displayName}</span>
                  <span className="font-bold">{scores[player.id] || 0}点</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 手札エリア */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-black text-lg font-semibold mb-3">あなたの手札</h3>
          {currentPlayerCards.length > 0 ? (
            <Hand
              cards={currentPlayerCards}
              selectedCardIds={selectedCards}
              playableCardIds={validCardIds}
              mode={phase === 'exchanging' ? 'exchange' : phase === 'playing' ? 'play' : 'view'}
              maxSelectableCards={3}
              showConfirmButton={phase === 'exchanging' && selectedCards.length === 3}
              isExchangeCompleted={
                !!(phase === 'exchanging' && 
                exchangeProgress && 
                currentPlayerId && 
                exchangeProgress.exchangedPlayers.includes(currentPlayerId))
              }
              isPlayerTurn={currentTurn === currentPlayerId}
              onCardSelect={handleCardSelect}
              onCardPlay={handleCardPlay}
              onConfirm={handleExchangeConfirm}
              onCancel={handleExchangeCancel}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              手札がありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};