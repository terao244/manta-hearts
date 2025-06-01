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
  isExchangeCompleted?: boolean;
  isPlayerTurn?: boolean;
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
  isExchangeCompleted = false,
  isPlayerTurn = true,
  onCardSelect,
  onCardPlay,
  onConfirm,
  onCancel
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
          flex flex-wrap justify-center gap-2 p-4 rounded-lg min-h-32 border-2 transition-all duration-300
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
                    ? 'opacity-50 cursor-not-allowed filter grayscale' 
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

      {/* 選択されたカードの詳細（交換モード時） */}
      {mode === 'exchange' && selectedCardIds.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">
            選択されたカード:
          </div>
          <div className="flex flex-wrap gap-1">
            {cards.filter(card => selectedCardIds.includes(card.id)).map(card => {
              const suitName = { 'SPADES': '♠', 'HEARTS': '♥', 'DIAMONDS': '♦', 'CLUBS': '♣' }[card.suit];
              const rankName = { 
                'ACE': 'A', 'TWO': '2', 'THREE': '3', 'FOUR': '4', 'FIVE': '5', 'SIX': '6', 
                'SEVEN': '7', 'EIGHT': '8', 'NINE': '9', 'TEN': '10', 'JACK': 'J', 
                'QUEEN': 'Q', 'KING': 'K' 
              }[card.rank];
              return (
                <span 
                  key={card.id}
                  className={`inline-block px-2 py-1 text-xs rounded ${
                    card.suit === 'HEARTS' || card.suit === 'DIAMONDS' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {suitName}{rankName}
                </span>
              );
            })}
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

      {/* 交換モード時のコントロール */}
      {mode === 'exchange' && showConfirmButton && !isExchangeCompleted && (
        <div className="mt-4 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <div className="text-sm text-yellow-800 mb-2">
              選択されたカード: {selectedCardIds.length}/{maxSelectableCards}枚
            </div>
            {selectedCardIds.length === maxSelectableCards && (
              <div className="text-xs text-green-700 animate-pulse">
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
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  isConfirmEnabled()
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isConfirmEnabled() ? '🔄 交換確定' : '3枚選択してください'}
              </button>
            )}
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