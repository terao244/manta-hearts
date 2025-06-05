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
  className = '',
  height = '100%'
}) => {
  // チャートデータの生成
  const chartData = React.useMemo(() => {
    // ハンド0-20の固定ラベルを作成
    const fixedLabels = Array.from({ length: 21 }, (_, i) => `ハンド ${i}`);

    // 累積スコアを計算
    const cumulativeData = players.map(player => {
      const playerData = new Array(21).fill(NaN); // ハンド0-20の配列
      let cumulativeScore = 0;

      // ハンド0は0点
      playerData[0] = 0;

      // scoreHistoryから累積スコアを計算
      scoreHistory.forEach(entry => {
        if (entry.hand >= 1 && entry.hand <= 20) {
          cumulativeScore += entry.scores?.[player.id] || 0;
          playerData[entry.hand] = cumulativeScore;
        }
      });

      return playerData;
    });

    const datasets = players.map((player, index) => {
      const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
      const isCurrentPlayer = currentPlayerId === player.id;

      return {
        label: player.displayName,
        data: cumulativeData[index],
        borderColor: color,
        backgroundColor: color + '20', // 透明度20%
        borderWidth: isCurrentPlayer ? 2 : 1,
        pointRadius: 0, // データポイントを非表示
        pointHoverRadius: 2, // ホバー時のみ小さく表示
        tension: 0.1,
        fill: false,
      };
    });

    return {
      labels: fixedLabels,
      datasets,
    };
  }, [players, scoreHistory, currentPlayerId]);

  // チャートオプション
  const chartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // アニメーション無効化
    },
    backgroundColor: '#ffffff', // 白い背景を設定
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          font: {
            size: 10,
            weight: 'bold' as const,
          },
          usePointStyle: true,
          pointStyle: 'circle',
          pointStyleWidth: 8,
          padding: 10,
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
        display: false,
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
            size: 11,
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
            size: 10,
          },
          maxTicksLimit: 11, // 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20の11個
          callback: function (value: string | number, index: number) {
            // 2ハンドおきに表示
            return index % 2 === 0 ? `ハンド ${index}` : '';
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '累積スコア (点)',
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          color: '#374151', // gray-700
        },
        min: 0,
        max: 125,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.3)', // gray-400 with opacity
          lineWidth: 1,
        },
        ticks: {
          stepSize: 25,
          color: '#6b7280', // gray-500
          font: {
            size: 10,
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
        radius: 0,
        hoverRadius: 2,
        hoverBackgroundColor: '#ffffff',
        hoverBorderWidth: 1,
        borderWidth: 0,
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
    <div className={`w-full bg-white rounded-lg shadow-md ${className}`} style={{ height }}>
      <div className="h-full w-full p-2">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* データなしの場合の表示 */}
      {scoreHistory.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <div className="text-sm font-medium">まだスコアデータがありません</div>
          <div className="text-xs">ゲームが進行するとスコア推移が表示されます</div>
        </div>
      )}
    </div>
  );
};