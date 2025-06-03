'use client';

import Link from 'next/link';
import { GameData } from '../../types';

interface GameCardProps {
  game: GameData;
}

// ゲーム状況に応じたバッジ色
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'FINISHED':
      return 'bg-green-100 text-green-800';
    case 'PLAYING':
      return 'bg-blue-100 text-blue-800';
    case 'PAUSED':
      return 'bg-yellow-100 text-yellow-800';
    case 'ABANDONED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// ゲーム状況の日本語表示
const getStatusText = (status: string) => {
  switch (status) {
    case 'FINISHED':
      return '完了';
    case 'PLAYING':
      return 'プレイ中';
    case 'PAUSED':
      return '一時停止';
    case 'ABANDONED':
      return '中断';
    default:
      return '不明';
  }
};

// 日時をフォーマット
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ゲーム時間をフォーマット
const formatDuration = (minutes?: number) => {
  if (!minutes) return '-';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}時間${mins}分`;
  }
  return `${mins}分`;
};

// 勝者を取得
const getWinner = (game: GameData) => {
  if (!game.winnerId) return null;
  return game.players.find(p => p.id === game.winnerId);
};

export default function GameCard({ game }: GameCardProps) {
  const winner = getWinner(game);
  
  return (
    <Link href={`/history/${game.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 p-6">
        {/* ヘッダー: 日時と状況 */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              ゲーム #{game.id}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDateTime(game.startTime)}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(game.status)}`}>
            {getStatusText(game.status)}
          </span>
        </div>

        {/* ゲーム情報 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">ゲーム時間</dt>
            <dd className="text-sm text-gray-900">{formatDuration(game.duration)}</dd>
          </div>
          {game.status === 'FINISHED' && game.endTime && (
            <div>
              <dt className="text-sm font-medium text-gray-500">終了日時</dt>
              <dd className="text-sm text-gray-900">{formatDateTime(game.endTime)}</dd>
            </div>
          )}
        </div>

        {/* プレイヤー結果 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">プレイヤー</h4>
          <div className="grid grid-cols-2 gap-2">
            {game.players.map((player) => (
              <div key={player.id} className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-900 truncate">
                  {player.name}
                  {player.id === game.winnerId && (
                    <span className="ml-1 text-yellow-500">👑</span>
                  )}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {player.finalScore}点
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 勝者表示（完了ゲームのみ） */}
        {game.status === 'FINISHED' && winner && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-sm text-gray-600">
              勝者: <span className="font-medium text-gray-900">{winner.name}</span>
              <span className="text-yellow-500 ml-1">🏆</span>
            </p>
          </div>
        )}

        {/* 進行中ゲームの場合 */}
        {game.status === 'PLAYING' && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-sm text-blue-600 font-medium">
              ゲーム進行中...
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}