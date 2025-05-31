'use client';

import React from 'react';
import type { PlayerInfo } from '@/types';

interface GameLobbyProps {
  currentPlayer: PlayerInfo;
  onJoinGame: () => void;
  isLoading: boolean;
  error?: string;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  currentPlayer,
  onJoinGame,
  isLoading,
  error
}) => {
  return (
    <div className="min-h-screen bg-green-900 text-white">
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">ハーツゲーム</h1>
          
          <div className="bg-white/10 rounded-lg p-6 mb-6">
            <h2 className="text-xl mb-4">ようこそ、{currentPlayer.displayName}さん！</h2>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">プレイヤー情報:</h3>
              <div className="bg-green-800 rounded p-3">
                <p>名前: {currentPlayer.displayName}</p>
                <p>ID: {currentPlayer.id}</p>
                <p>表示順: {currentPlayer.displayOrder}</p>
                <p>状態: {currentPlayer.isActive ? 'アクティブ' : '非アクティブ'}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <h3 className="font-semibold mb-2">エラー:</h3>
              <p>{error}</p>
            </div>
          )}

          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">ゲームについて</h3>
            <div className="space-y-2 text-sm mb-6">
              <p>• ハーツは4人で行うトリックテイキングゲームです</p>
              <p>• ハートのカード（1点）とスペードのクイーン（13点）を取らないようにしましょう</p>
              <p>• 最初に100点に達したプレイヤーがいた時点でゲーム終了</p>
              <p>• 最も得点の低いプレイヤーが勝者です</p>
              <p>• 各ハンドの開始時に、隣のプレイヤーに3枚のカードを渡します</p>
            </div>

            <div className="text-center">
              <button
                onClick={onJoinGame}
                disabled={isLoading}
                className={`
                  px-6 py-3 rounded-lg font-semibold transition-all duration-200
                  ${isLoading 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }
                  text-white shadow-lg
                `}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ゲームに参加中...
                  </div>
                ) : (
                  'ゲームに参加'
                )}
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-300 text-center">
              <p>ゲームに参加すると、他のプレイヤーとマッチングされます</p>
              <p>4人のプレイヤーが揃うと自動的にゲームが開始されます</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};