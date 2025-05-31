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
  const sortedCards = [...cards].sort((a, b) => a.sortOrder - b.sortOrder);

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
    if (mode !== 'exchange') return '';
    
    const selectedCount = selectedCardIds.length;
    if (selectedCount === 0) {
      return `${maxSelectableCards}枚のカードを選択してください`;
    } else if (selectedCount < maxSelectableCards) {
      return `あと${maxSelectableCards - selectedCount}枚選択してください`;
    } else if (selectedCount === maxSelectableCards) {
      return `${maxSelectableCards}枚のカードを選択してください`;
    } else {
      return `選択できるのは${maxSelectableCards}枚までです`;
    }
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
      {/* 手札表示エリア */}
      <div 
        data-testid="hand-container"
        className="flex flex-wrap justify-center gap-2 p-4 bg-green-100 rounded-lg min-h-32"
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

      {/* 交換モード時のコントロール */}
      {mode === 'exchange' && (
        <div className="mt-4 text-center">
          <div className="mb-3">
            <span className="text-sm text-gray-600">
              {getSelectionMessage()}
            </span>
          </div>
          
          {showConfirmButton && (
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
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  交換確定
                </button>
              )}
            </div>
          )}
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