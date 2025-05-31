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
  showConfirmButton?: boolean;
  onCardSelect?: (card: CardInfo) => void;
  onCardPlay?: (card: CardInfo) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const Hand: React.FC<HandProps> = ({
  cards,
  selectedCardIds = [],
  playableCardIds = [],
  mode = 'view',
  maxSelectableCards = 3,
  showConfirmButton = false,
  onCardSelect,
  onCardPlay,
  onConfirm,
  onCancel
}) => {
  // カードを直感的にソート（スート別、ランク順）
  const sortedCards = [...cards].sort((a, b) => {
    // スート優先度: スペード > ハート > ダイヤ > クラブ
    const suitOrder = { 'SPADES': 1, 'HEARTS': 2, 'DIAMONDS': 3, 'CLUBS': 4 };
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
      if (playableCardIds.length === 0) {
        return '任意のカードをプレイできます';
      } else {
        return 'プレイ可能なカードから選択してください';
      }
    }
    return '';
  };

  const getHandSummary = (): string => {
    const cardCount = cards.length;
    const suitCounts = cards.reduce((acc, card) => {
      const suitName = { 'SPADES': 'スペード', 'HEARTS': 'ハート', 'DIAMONDS': 'ダイヤ', 'CLUBS': 'クラブ' }[card.suit];
      acc[suitName] = (acc[suitName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const suitSummary = Object.entries(suitCounts)
      .map(([suit, count]) => `${suit}${count}`)
      .join(' ');
    
    return `手札${cardCount}枚 (${suitSummary})`;
  };

  const isConfirmEnabled = (): boolean => {
    return mode === 'exchange' && selectedCardIds.length === maxSelectableCards;
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        手札がありません
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 手札情報ヘッダー */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-600">
          {getHandSummary()}
        </div>
        {mode !== 'view' && (
          <div className="text-sm font-medium text-blue-600">
            {mode === 'exchange' ? '交換モード' : 'プレイモード'}
          </div>
        )}
      </div>

      {/* 手札表示エリア */}
      <div 
        data-testid="hand-container"
        className="flex flex-wrap justify-center gap-2 p-4 bg-green-100 rounded-lg min-h-32 border-2 border-green-200"
      >
        {sortedCards.map((card) => (
          <div
            key={card.id}
            className="transition-transform duration-200 hover:translate-y-[-8px]"
          >
            <Card
              card={card}
              isPlayable={isCardPlayable(card)}
              isSelected={isCardSelected(card)}
              onClick={() => handleCardClick(card)}
              size="medium"
            />
          </div>
        ))}
      </div>

      {/* モード別のメッセージ表示 */}
      {(mode === 'exchange' || mode === 'play') && (
        <div className="mt-2 text-center">
          <div className="text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2 inline-block">
            💡 {getSelectionMessage()}
          </div>
        </div>
      )}

      {/* 交換モード時のコントロール */}
      {mode === 'exchange' && showConfirmButton && (
        <div className="mt-4 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <div className="text-sm text-yellow-800 mb-2">
              選択されたカード: {selectedCardIds.length}/{maxSelectableCards}枚
            </div>
            {selectedCardIds.length === maxSelectableCards && (
              <div className="text-xs text-green-700">
                ✓ 交換の準備が完了しました
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
            )}
            {onConfirm && (
              <button
                onClick={onConfirm}
                disabled={!isConfirmEnabled()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isConfirmEnabled()
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isConfirmEnabled() ? '交換確定' : '3枚選択してください'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* プレイモード時の情報表示 */}
      {mode === 'play' && playableCardIds.length > 0 && (
        <div className="mt-2 text-center">
          <span className="text-sm text-blue-600">
            プレイできるカードをクリックしてください
          </span>
        </div>
      )}
    </div>
  );
};