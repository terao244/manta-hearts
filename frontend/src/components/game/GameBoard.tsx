'use client';

import React, { useState } from 'react';
import { Hand } from './Hand';
import type { GameBoardProps, CardInfo, PlayerInfo } from '@/types';

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentPlayerId,
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
            <div className="text-sm">
              {status === 'FINISHED' ? 'ゲーム終了' : getPhaseMessage()}
            </div>
            {heartsBroken && (
              <div className="text-red-400 text-sm font-semibold">
                ハートブレイク中
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        {/* ゲームエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* プレイヤー情報 */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-3">プレイヤー</h3>
            <div className="space-y-2">
              {players
                .filter(player => player && player.id != null)
                .map(player => (
                  <div
                    key={player.id}
                    data-testid={`player-${player.id}`}
                    className={`
                      p-3 bg-white rounded-lg shadow-md border-2 transition-all
                      ${player.id === currentPlayerId ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'}
                      ${player.id === currentTurn ? 'bg-yellow-50 border-yellow-300' : ''}
                    `}
                  >
                    <div className="text-center">
                      <div className="font-semibold text-sm">{player.displayName}</div>
                      <div className="text-xs text-gray-500">{getPlayerPosition(player.id)}</div>
                      <div className="text-lg font-bold text-green-600">{scores[player.id] || 0}点</div>
                      {player.id === currentTurn && (
                        <div className="text-xs text-yellow-600 font-semibold">手番</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 中央エリア（トリック表示） */}
          <div className="lg:col-span-2">
            <div className="bg-green-800 rounded-lg p-6 min-h-64 flex items-center justify-center">
              <div 
                data-testid="trick-area"
                className="w-full"
              >
                <h3 className="text-center text-lg font-semibold mb-4">
                  現在のトリック
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {getCurrentTrickCards().map((cardPlay, index) => {
                    const player = players.find(p => p.id === cardPlay.playerId);
                    return (
                      <div key={`${cardPlay.playerId}-${cardPlay.cardId}`} className="text-center">
                        <div className="text-xs mb-1">{player?.displayName}</div>
                        {/* 実際のカード情報が必要な場合は、cardPlay.cardIdからカード情報を取得 */}
                        <div className="w-16 h-24 bg-white rounded border flex items-center justify-center text-black text-sm">
                          カード#{cardPlay.cardId}
                        </div>
                      </div>
                    );
                  })}
                  {getCurrentTrickCards().length === 0 && (
                    <div className="text-center text-gray-300">
                      トリック開始前
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ゲーム情報 */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-3">ゲーム情報</h3>
            <div className="bg-green-800 rounded-lg p-4 space-y-2 text-sm">
              <div>ゲームID: {gameId}</div>
              <div>状態: {status}</div>
              <div>フェーズ: {phase}</div>
              <div>ハンド: {currentHand}</div>
              <div>トリック: {currentTrick}</div>
              <div>ハートブレイク: {heartsBroken ? 'はい' : 'いいえ'}</div>
              <div>完了トリック: {tricks.length}</div>
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
              playableCardIds={[]} // TODO: ゲームロジックから取得
              mode={phase === 'exchanging' ? 'exchange' : phase === 'playing' ? 'play' : 'view'}
              maxSelectableCards={3}
              showConfirmButton={phase === 'exchanging' && selectedCards.length === 3}
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