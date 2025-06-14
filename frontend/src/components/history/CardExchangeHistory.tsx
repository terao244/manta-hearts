import React, { useState } from 'react';
import { CardExchange } from '../../lib/api/games';
import { formatCardFromInfo, getCardColorClass } from '../../utils/cardFormatting';
import { CardInfo } from '../../types';

interface CardExchangeHistoryProps {
  gameId: number;
  handId: number;
  handNumber: number;
  exchangeDirection: 'left' | 'right' | 'across' | 'none';
  exchanges?: CardExchange[];
  isLoading?: boolean;
  error?: string;
  onLoadExchanges?: () => void;
}

interface GroupedExchange {
  fromPlayer: { id: number; name: string };
  toPlayer: { id: number; name: string };
  cards: CardInfo[];
}

export function CardExchangeHistory({
  handNumber,
  exchangeDirection,
  exchanges,
  isLoading = false,
  error,
  onLoadExchanges,
}: CardExchangeHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // 展開時に交換データがない場合はロード
    if (newExpanded && !exchanges && onLoadExchanges && exchangeDirection !== 'none') {
      onLoadExchanges();
    }
  };

  const getExchangeDirectionText = (direction: string) => {
    switch (direction) {
      case 'left': return '左隣へ';
      case 'right': return '右隣へ';
      case 'across': return '向かいへ';
      case 'none': return '交換なし';
      default: return direction;
    }
  };

  // 交換データをプレイヤー別にグループ化
  const groupedExchanges = exchanges?.reduce((acc, exchange) => {
    if (!acc[exchange.fromPlayer.id]) {
      acc[exchange.fromPlayer.id] = {
        fromPlayer: exchange.fromPlayer,
        toPlayer: exchange.toPlayer,
        cards: [],
      };
    }
    acc[exchange.fromPlayer.id].cards.push(exchange.card);
    return acc;
  }, {} as Record<number, GroupedExchange>);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={handleToggle}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <span className="font-medium">ハンド {handNumber} のカード交換</span>
          <span className="text-sm text-gray-600">
            {getExchangeDirectionText(exchangeDirection)}
          </span>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          {exchangeDirection === 'none' && (
            <div className="text-center py-4">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <p className="text-sm">このハンドではカード交換は行われませんでした</p>
              </div>
            </div>
          )}

          {exchangeDirection !== 'none' && isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">交換データを読み込み中...</span>
            </div>
          )}

          {exchangeDirection !== 'none' && error && (
            <div className="text-center py-4">
              <div className="text-red-600 mb-2">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 text-sm">{error}</p>
              {onLoadExchanges && (
                <button
                  onClick={onLoadExchanges}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  再試行
                </button>
              )}
            </div>
          )}

          {exchangeDirection !== 'none' && exchanges && groupedExchanges && !isLoading && !error && (
            <div className="mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-1 py-0.5 text-left font-medium">送信者</th>
                      <th className="border border-gray-300 px-1 py-0.5 text-left font-medium">受信者</th>
                      <th className="border border-gray-300 px-1 py-0.5 text-left font-medium">交換カード</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(groupedExchanges).map((group) => {
                      const sortedCards = [...group.cards].sort((a, b) => a.sortOrder - b.sortOrder);

                      return (
                        <tr key={group.fromPlayer.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-1 py-0.5 font-medium align-top">
                            {group.fromPlayer.name}
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 font-medium align-top">
                            {group.toPlayer.name}
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5">
                            <div className="flex flex-wrap gap-1">
                              {sortedCards.map((card) => {
                                const cardDisplay = formatCardFromInfo(card);
                                const colorClass = getCardColorClass(cardDisplay.color);

                                return (
                                  <span
                                    key={`${card.suit}-${card.rank}`}
                                    className={`inline-flex items-center justify-center px-1 py-0.5 rounded text-xs font-bold border bg-white border-gray-200 min-w-[40px] ${colorClass}`}
                                    title={`${cardDisplay.displayText}`}
                                  >
                                    {cardDisplay.displayText}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {exchangeDirection !== 'none' && !exchanges && !isLoading && !error && (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-3">交換データを表示するには、上記ボタンをクリックしてください</p>
              {onLoadExchanges && (
                <button
                  onClick={onLoadExchanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  交換履歴を表示
                </button>
              )}
            </div>
          )}

          {exchangeDirection !== 'none' && exchanges && exchanges.length === 0 && !isLoading && !error && (
            <div className="text-center py-4">
              <p className="text-gray-500">交換データが見つかりませんでした</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CardExchangeHistory;