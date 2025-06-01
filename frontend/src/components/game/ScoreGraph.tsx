'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ScoreGraphProps } from '@/types';

// Chart.js の必要なコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// プレイヤー別の色設定
const PLAYER_COLORS = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
];

export const ScoreGraph: React.FC<ScoreGraphProps> = ({
  players,
  scoreHistory,
  currentPlayerId,
  className = ''
}) => {
  // チャートデータの生成
  const chartData = React.useMemo(() => {
    if (!scoreHistory || scoreHistory.length === 0) {
      return {
        labels: [],
        datasets: players.map((player, index) => ({
          label: player.displayName,
          data: [],
          borderColor: PLAYER_COLORS[index % PLAYER_COLORS.length],
          backgroundColor: PLAYER_COLORS[index % PLAYER_COLORS.length] + '20',
          borderWidth: currentPlayerId === player.id ? 4 : 2,
          pointRadius: currentPlayerId === player.id ? 6 : 4,
          pointHoverRadius: currentPlayerId === player.id ? 8 : 6,
          tension: 0.1,
          fill: false,
        }))
      };
    }

    const labels = scoreHistory.map(entry => `ハンド ${entry.hand}`);
    
    const datasets = players.map((player, index) => {
      const data = scoreHistory.map(entry => entry.scores?.[player.id] || 0);
      const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
      const isCurrentPlayer = currentPlayerId === player.id;
      
      return {
        label: player.displayName,
        data,
        borderColor: color,
        backgroundColor: color + '20', // 透明度20%
        borderWidth: isCurrentPlayer ? 4 : 2,
        pointRadius: isCurrentPlayer ? 6 : 4,
        pointHoverRadius: isCurrentPlayer ? 8 : 6,
        tension: 0.1,
        fill: false,
      };
    });

    return {
      labels,
      datasets,
    };
  }, [players, scoreHistory, currentPlayerId]);

  // チャートオプション
  const chartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          font: {
            size: 13,
            weight: 'bold' as const,
          },
          usePointStyle: true,
          pointStyle: 'circle',
          pointStyleWidth: 12,
          padding: 20,
          // generateLabels: function(chart: any) {
          //   const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
          //   const labels = original.call(this, chart);
          //   
          //   // 現在のプレイヤーのラベルを強調
          //   labels.forEach((label: any, index: number) => {
          //     const dataset = chart.data.datasets[index];
          //     if (dataset.borderWidth === 4) { // 現在のプレイヤー
          //       label.fontStyle = 'bold';
          //       label.fontColor = '#1f2937'; // gray-800
          //     }
          //   });
          //   
          //   return labels;
          // },
        },
      },
      title: {
        display: true,
        text: 'スコア推移グラフ',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: '#1f2937', // gray-800
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        // callbacks: {
        //   title: (context: any) => {
        //     return context[0]?.label || '';
        //   },
        //   label: (context: any) => {
        //     const playerName = context.dataset.label;
        //     const score = context.parsed.y;
        //     const isCurrentPlayer = context.dataset.borderWidth === 4;
        //     const prefix = isCurrentPlayer ? '👤 ' : '';
        //     return `${prefix}${playerName}: ${score}点`;
        //   },
        //   afterBody: (context: any) => {
        //     if (context.length > 1) {
        //       const scores = context.map((c: any) => c.parsed.y);
        //       const minScore = Math.min(...scores);
        //       const maxScore = Math.max(...scores);
        //       if (minScore !== maxScore) {
        //         return [``, `最高: ${maxScore}点`, `最低: ${minScore}点`, `差: ${maxScore - minScore}点`];
        //       }
        //     }
        //     return [];
        //   },
        // },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'ハンド番号',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          color: '#374151', // gray-700
        },
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.3)', // gray-400 with opacity
          lineWidth: 1,
        },
        ticks: {
          color: '#6b7280', // gray-500
          font: {
            size: 12,
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '累積スコア (点)',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          color: '#374151', // gray-700
        },
        min: 0,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.3)', // gray-400 with opacity
          lineWidth: 1,
        },
        ticks: {
          stepSize: 10,
          color: '#6b7280', // gray-500
          font: {
            size: 12,
          },
          // callback: function(value: any) {
          //   return value + '点';
          // },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
        hoverBackgroundColor: '#ffffff',
        hoverBorderWidth: 3,
        borderWidth: 2,
      },
      line: {
        tension: 0.2, // 少し曲線にする
      },
    },
    // hover: {
    //   animationDuration: 300,
    // },
  }), []);

  return (
    <div className={`bg-white rounded-lg p-4 shadow-md ${className}`}>
      <div className="h-64 w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      {/* スコア統計情報 */}
      {scoreHistory.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-bold text-gray-800">現在のスコア</h4>
            <div className="text-sm text-gray-600">
              ハンド {scoreHistory.length} 完了
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {players
              .map((player, index) => {
                const latestScoreEntry = scoreHistory[scoreHistory.length - 1];
                const latestScore = latestScoreEntry?.scores?.[player.id] || 0;
                const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
                const isCurrentPlayer = currentPlayerId === player.id;
                
                return { player, index, latestScore, color, isCurrentPlayer };
              })
              .sort((a, b) => a.latestScore - b.latestScore) // スコアの昇順（低い順）
              .map(({ player, latestScore, color, isCurrentPlayer }, rank) => {
                const isWinning = rank === 0; // 最低スコアが勝利
                
                return (
                  <div
                    key={player.id}
                    className={`relative text-center p-3 rounded-lg shadow-sm transition-all duration-200 ${
                      isCurrentPlayer 
                        ? 'ring-2 ring-blue-500 bg-blue-50 transform scale-105' 
                        : isWinning
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {/* 順位表示 */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs font-bold">
                      {rank + 1}
                    </div>
                    
                    {/* プレイヤー色インジケータ */}
                    <div
                      className="w-5 h-5 rounded-full mx-auto mb-2 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    
                    {/* プレイヤー名 */}
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentPlayer ? 'text-blue-800' : isWinning ? 'text-green-800' : 'text-gray-700'
                    }`}>
                      {isCurrentPlayer && '👤 '}
                      {player.displayName}
                      {isWinning && ' 🏆'}
                    </div>
                    
                    {/* スコア */}
                    <div className={`text-lg font-bold ${
                      isCurrentPlayer ? 'text-blue-900' : isWinning ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {latestScore}点
                    </div>
                    
                    {/* スコア変化表示 */}
                    {scoreHistory.length > 1 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const prevScoreEntry = scoreHistory[scoreHistory.length - 2];
                          const prevScore = prevScoreEntry?.scores?.[player.id] || 0;
                          const change = latestScore - prevScore;
                          if (change === 0) return '変化なし';
                          return change > 0 ? `+${change}` : `${change}`;
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
          
          {/* ゲーム終了条件表示 */}
          {scoreHistory.length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-600">
                ゲーム終了条件: 100点到達（最低スコアのプレイヤーが勝利）
              </div>
              {(() => {
                const latestScoreEntry = scoreHistory[scoreHistory.length - 1];
                if (!latestScoreEntry) return null;
                
                const maxScore = Math.max(...players.map(p => latestScoreEntry.scores?.[p.id] || 0));
                if (maxScore >= 100) {
                  return (
                    <div className="text-lg font-bold text-red-600 mt-2">
                      🏁 ゲーム終了！
                    </div>
                  );
                } else {
                  return (
                    <div className="text-sm text-gray-500 mt-1">
                      現在の最高スコア: {maxScore}点
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </div>
      )}
      
      {/* データなしの場合の表示 */}
      {scoreHistory.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-medium">まだスコアデータがありません</div>
          <div className="text-sm">ゲームが進行するとスコア推移が表示されます</div>
        </div>
      )}
    </div>
  );
};