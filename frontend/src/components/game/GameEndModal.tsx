'use client';

import { useEffect, useState } from 'react';
import type { GameResult, PlayerInfo } from '@/types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GameEndModalProps {
  isOpen: boolean;
  gameResult: GameResult;
  players: PlayerInfo[];
  onClose: () => void;
}

export default function GameEndModal({ isOpen, gameResult, players, onClose }: GameEndModalProps) {
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // モーダルが開いた時に少し遅延してグラフを表示
      const timer = setTimeout(() => setShowGraph(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowGraph(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPlayerName = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    return player?.displayName || player?.name || `Player ${playerId}`;
  };

  const getRankingSuffix = (rank: number) => {
    switch (rank) {
      case 1: return '位';
      case 2: return '位';
      case 3: return '位';
      case 4: return '位';
      default: return '位';
    }
  };

  // Chart.jsのデータ準備
  const chartData = {
    labels: gameResult.scoreHistory.map((_, index) => `ハンド ${index + 1}`),
    datasets: gameResult.rankings.map((ranking, index) => {
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']; // 赤、青、緑、オレンジ
      const color = colors[index % colors.length];
      
      // 各ハンドでの累積スコアを計算
      const cumulativeData = gameResult.scoreHistory.map(handData => {
        return handData.scores[ranking.playerId] || 0;
      });

      return {
        label: getPlayerName(ranking.playerId),
        data: cumulativeData,
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 3,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    }),
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: '得点推移グラフ',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'ハンド',
        },
      },
      y: {
        title: {
          display: true,
          text: '累積スコア',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* タイトル */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">ゲーム終了</h2>
          <div className="text-lg text-gray-600">
            優勝: <span className="font-semibold text-blue-600">{getPlayerName(gameResult.winnerId)}</span>
          </div>
        </div>

        {/* 最終順位表 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-center">最終順位</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid gap-3">
              {gameResult.rankings.map((ranking) => (
                <div
                  key={ranking.playerId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    ranking.rank === 1
                      ? 'bg-yellow-100 border-2 border-yellow-300'
                      : ranking.rank === 2
                      ? 'bg-gray-100 border-2 border-gray-300'
                      : ranking.rank === 3
                      ? 'bg-orange-100 border-2 border-orange-300'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        ranking.rank === 1
                          ? 'bg-yellow-500'
                          : ranking.rank === 2
                          ? 'bg-gray-500'
                          : ranking.rank === 3
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                      }`}
                    >
                      {ranking.rank}
                    </div>
                    <span className="font-semibold text-lg">{getPlayerName(ranking.playerId)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{ranking.score}点</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 得点推移グラフ */}
        {showGraph && gameResult.scoreHistory.length > 0 && (
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div style={{ height: '400px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {/* 閉じるボタン */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}