import React, { useState } from 'react';
import { CardInfo } from '../../types';
import { formatCardsFromInfo, getCardColorClass } from '../../utils/cardFormatting';

interface HandHistoryProps {
  gameId: number;
  handId: number;
  handNumber: number;
  players: Array<{
    id: number;
    name: string;
  }>;
  playerCards?: Record<number, CardInfo[]>;
  isLoading?: boolean;
  error?: string;
  onLoadCards?: () => void;
}

export function HandHistory({
  handNumber,
  players,
  playerCards,
  isLoading = false,
  error,
  onLoadCards,
}: HandHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // 展開時にカードデータがない場合はロード
    if (newExpanded && !playerCards && onLoadCards) {
      onLoadCards();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={handleToggle}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <span className="font-medium">ハンド {handNumber} の初期手札</span>
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
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">手札データを読み込み中...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <div className="text-red-600 mb-2">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 text-sm">{error}</p>
              {onLoadCards && (
                <button
                  onClick={onLoadCards}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  再試行
                </button>
              )}
            </div>
          )}

          {playerCards && !isLoading && !error && (
            <div className="mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-1 py-0.5 text-left font-medium">プレイヤー</th>
                      <th className="border border-gray-300 px-1 py-0.5 text-left font-medium">手札</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map(player => {
                      const cards = playerCards[player.id] || [];
                      const sortedCards = [...cards].sort((a, b) => a.sortOrder - b.sortOrder);
                      const formattedCards = formatCardsFromInfo(sortedCards);

                      return (
                        <tr key={player.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-1 py-0.5 font-medium align-top">
                            {player.name}
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5">
                            {cards.length === 0 ? (
                              <span className="text-gray-500 text-xs">手札データがありません</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {formattedCards.map((cardDisplay, index) => {
                                  const card = sortedCards[index];
                                  const colorClass = getCardColorClass(cardDisplay.color);

                                  return (
                                    <span
                                      key={`${card.suit}-${card.rank}`}
                                      className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-bold border bg-white border-gray-200 ${colorClass}`}
                                      title={`${cardDisplay.displayText}`}
                                    >
                                      {cardDisplay.displayText}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!playerCards && !isLoading && !error && (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-3">手札データを表示するには、上記ボタンをクリックしてください</p>
              {onLoadCards && (
                <button
                  onClick={onLoadCards}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  手札を表示
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HandHistory;