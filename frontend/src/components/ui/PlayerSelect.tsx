'use client';

import React, { useState, useEffect } from 'react';
import type { PlayerSelectProps } from '@/types';
import { fetchPlayersWithRetry } from '@/lib/api/games';

interface PlayerData {
  id: number;
  name: string;
  displayName: string;
  displayOrder: number;
  isActive: boolean;
}

export const PlayerSelect: React.FC<PlayerSelectProps> = ({
  onPlayerSelect,
  isLoading,
  error
}) => {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [playersError, setPlayersError] = useState<string | undefined>();

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoadingPlayers(true);
        setPlayersError(undefined);
        const playersData = await fetchPlayersWithRetry();
        
        // アクティブなプレイヤーのみをフィルターし、displayOrderでソート
        const activePlayers = playersData
          .filter(player => player.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .slice(0, 4); // 最初の4人のみ取得
        
        setPlayers(activePlayers);
      } catch (err) {
        console.error('Failed to load players:', err);
        setPlayersError('プレイヤー情報の取得に失敗しました');
      } finally {
        setLoadingPlayers(false);
      }
    };

    loadPlayers();
  }, []);

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ハーツゲーム
          </h1>
          <p className="text-gray-600">
            プレイヤーを選択すると自動的にゲームに参加します
          </p>
        </div>

        {(error || playersError) && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error || playersError}
          </div>
        )}

        {loadingPlayers ? (
          <div className="text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-gray-600">プレイヤー情報を読み込み中...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onPlayerSelect(player.id)}
                  disabled={isLoading}
                  className={`
                    p-4 rounded-lg border-2 text-center font-semibold transition-all duration-200
                    ${isLoading 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:bg-blue-200'
                    }
                  `}
                >
                  {player.displayName}
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="text-center">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-gray-600">ゲームに参加中...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};