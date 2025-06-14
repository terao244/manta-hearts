'use client';

import React from 'react';
import { Card } from './Card';
import type { CardInfo } from '@/types';

interface HandProps {
  cards: CardInfo[];
  selectedCardIds?: number[];
  playableCardIds?: number[];
  mode?: 'play' | 'exchange' | 'view';
  maxSelectableCards?: number;
  isExchangeCompleted?: boolean;
  isPlayerTurn?: boolean;
  onCardSelect?: (card: CardInfo) => void;
  onCardPlay?: (card: CardInfo) => void;
}

export const Hand: React.FC<HandProps> = ({
  cards,
  selectedCardIds = [],
  playableCardIds = [],
  mode = 'view',
  maxSelectableCards = 3,
  isExchangeCompleted = false,
  isPlayerTurn = true,
  onCardSelect,
  onCardPlay
}) => {
  // カードを直感的にソート（スート別、ランク順）
  const sortedCards = [...cards].sort((a, b) => {
    // スート優先度: クラブ > ダイヤ > スペード > ハート
    const suitOrder = { 'CLUBS': 1, 'DIAMONDS': 2, 'SPADES': 3, 'HEARTS': 4 };
    const rankOrder = {
      'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 'SIX': 6, 'SEVEN': 7, 'EIGHT': 8,
      'NINE': 9, 'TEN': 10, 'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14
    };
    
    if (a.suit !== b.suit) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return rankOrder[a.rank] - rankOrder[b.rank];
  });


  const handleCardClick = (card: CardInfo) => {
    // 手番制御: プレイモードでは手番でない場合は操作を無効化
    if (mode === 'play' && !isPlayerTurn) {
      return;
    }
    
    if (mode === 'exchange' && onCardSelect) {
      onCardSelect(card);
    } else if (mode === 'play' && onCardPlay) {
      if (playableCardIds.length === 0 || playableCardIds.includes(card.id)) {
        onCardPlay(card);
      }
    }
  };

  const isCardPlayable = (card: CardInfo): boolean => {
    if (mode === 'view') return false;
    if (mode === 'exchange') return true;
    if (mode === 'play') {
      // 手番でない場合は全てのカードをプレイ不可にする
      if (!isPlayerTurn) return false;
      return playableCardIds.length === 0 || playableCardIds.includes(card.id);
    }
    return false;
  };

  const isCardSelected = (card: CardInfo): boolean => {
    return selectedCardIds.includes(card.id);
  };

  const getSelectionMessage = (): string => {
    if (mode === 'exchange') {
      const selectedCount = selectedCardIds.length;
      if (selectedCount === 0) {
        return `交換するカードを${maxSelectableCards}枚選択してください`;
      } else if (selectedCount < maxSelectableCards) {
        return `${selectedCount}/${maxSelectableCards}枚選択中（あと${maxSelectableCards - selectedCount}枚）`;
      } else if (selectedCount === maxSelectableCards) {
        return `${maxSelectableCards}枚のカードを選択しました`;
      } else {
        return `選択できるのは${maxSelectableCards}枚までです`;
      }
    } else if (mode === 'play') {
      if (!isPlayerTurn) {
        return '他のプレイヤーの手番です。お待ちください';
      } else if (playableCardIds.length === 0) {
        return '任意のカードをプレイできます';
      } else {
        return 'プレイ可能なカードから選択してください';
      }
    }
    return '';
  };



  if (cards.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        手札がありません
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* 交換モード時の選択プログレス */}
      {mode === 'exchange' && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">選択進捗</span>
            <span className="text-xs font-medium">
              {selectedCardIds.length}/{maxSelectableCards}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                selectedCardIds.length === maxSelectableCards 
                  ? 'bg-green-500' 
                  : 'bg-blue-500'
              }`}
              style={{ 
                width: `${(selectedCardIds.length / maxSelectableCards) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* 手札表示エリア */}
      <div 
        data-testid="hand-container"
        className={`
          flex flex-wrap justify-center gap-2 p-3 rounded-lg min-h-20 border-2 transition-all duration-300
          ${mode === 'play' && !isPlayerTurn 
            ? 'bg-gray-100 border-gray-300 opacity-60' 
            : 'bg-green-100 border-green-200'
          }
        `}
      >
        {sortedCards.map((card, index) => {
          const isSelected = isCardSelected(card);
          const isPlayable = isCardPlayable(card);
          const isDisabledByTurn = mode === 'play' && !isPlayerTurn;
          
          return (
            <div
              key={card.id}
              className={`
                transition-all duration-300 ease-in-out transform-gpu
                ${isSelected 
                  ? 'translate-y-[-12px] scale-105 z-10 shadow-lg border-2 border-blue-400 rounded-lg' 
                  : isDisabledByTurn 
                    ? 'opacity-60 cursor-not-allowed brightness-75 contrast-75' 
                    : 'hover:translate-y-[-8px] hover:scale-102'
                }
                ${!isPlayable && mode === 'play' && !isDisabledByTurn
                  ? 'hover:translate-y-[-2px] opacity-60' 
                  : ''
                }
                ${mode === 'exchange' && isPlayable 
                  ? 'hover:shadow-md hover:border hover:border-blue-200 hover:rounded-lg' 
                  : ''
                }
                ${isDisabledByTurn 
                  ? 'pointer-events-none' 
                  : ''
                }
              `}
              style={{
                animationDelay: `${index * 50}ms`
              }}
              title={isDisabledByTurn ? '他のプレイヤーの手番です' : undefined}
            >
              <Card
                card={card}
                isPlayable={isPlayable && !isDisabledByTurn}
                isSelected={isSelected}
                onClick={() => handleCardClick(card)}
                size="medium"
              />
            </div>
          );
        })}
      </div>

      {/* モード別のメッセージ表示 */}
      {(mode === 'exchange' || mode === 'play') && (
        <div className="mt-2 text-center">
          <div className={`
            text-sm rounded-lg px-3 py-2 inline-block
            ${mode === 'play' && !isPlayerTurn 
              ? 'text-gray-600 bg-gray-50 border border-gray-200' 
              : 'text-gray-700 bg-blue-50'
            }
          `}>
            {mode === 'play' && !isPlayerTurn ? '⏳' : '💡'} {getSelectionMessage()}
          </div>
        </div>
      )}


      {/* 交換完了メッセージ */}
      {mode === 'exchange' && isExchangeCompleted && (
        <div className="mt-4 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-700 font-semibold mb-2 flex items-center justify-center gap-2">
              <span className="text-xl">✅</span>
              <span>カード交換が完了しました</span>
            </div>
            <div className="text-sm text-green-600">
              他のプレイヤーの交換完了をお待ちください...
            </div>
          </div>
        </div>
      )}


      {/* プレイモード時の情報表示 */}
      {mode === 'play' && playableCardIds.length > 0 && isPlayerTurn && (
        <div className="mt-2 text-center">
          <span className="text-sm text-blue-600">
            プレイできるカードをクリックしてください
          </span>
        </div>
      )}
    </div>
  );
};