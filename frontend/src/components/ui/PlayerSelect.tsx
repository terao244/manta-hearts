'use client';

import React from 'react';
import type { PlayerSelectProps } from '@/types';

const PLAYERS = [
  { name: 'プレイヤー1', displayName: 'プレイヤー1' },
  { name: 'プレイヤー2', displayName: 'プレイヤー2' },
  { name: 'プレイヤー3', displayName: 'プレイヤー3' },
  { name: 'プレイヤー4', displayName: 'プレイヤー4' },
];

export const PlayerSelect: React.FC<PlayerSelectProps> = ({
  onPlayerSelect,
  isLoading,
  error
}) => {
  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ハーツゲーム
          </h1>
          <p className="text-gray-600">
            プレイヤーを選択してください
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {PLAYERS.map((player) => (
            <button
              key={player.name}
              onClick={() => onPlayerSelect(player.name)}
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
              <span className="text-gray-600">接続中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};