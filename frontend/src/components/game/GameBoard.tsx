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
  return (
    <div
      className={`
        p-3 bg-white rounded-lg shadow-md border-2 transition-all min-w-24 text-center
        ${player.id === currentPlayerId ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'}
        ${player.id === currentTurn ? 'bg-yellow-50 border-yellow-300' : ''}
      `}
    >
      <div className="text-xs font-semibold text-gray-800">{player.displayName}</div>
      <div className="text-lg font-bold text-green-600">{scores[player.id] || 0}点</div>
      {player.id === currentTurn && (
        <div className="text-xs text-yellow-600 font-semibold">手番</div>
      )}
    </div>
  );
};

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentPlayerId,
  validCardIds = [],
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
                className="bg-green-700 rounded-lg p-4 w-48 h-32 flex flex-col items-center justify-center"
              >
                <h4 className="text-sm font-semibold mb-2 text-center">
                  トリック {currentTrick}
                </h4>
                <div className="flex flex-wrap justify-center gap-1">
                  {getCurrentTrickCards().map((cardPlay, index) => {
                    const player = players.find(p => p.id === cardPlay.playerId);
                    return (
                      <div key={`${cardPlay.playerId}-${cardPlay.cardId}`} className="text-center">
                        <div className="text-xs mb-1">{player?.displayName?.slice(0, 3)}</div>
                        <div className="w-8 h-12 bg-white rounded border flex items-center justify-center text-black text-xs">
                          #{cardPlay.cardId}
                        </div>
                      </div>
                    );
                  })}
                  {getCurrentTrickCards().length === 0 && (
                    <div className="text-center text-gray-300 text-sm">
                      待機中
                    </div>
                  )}
                </div>
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