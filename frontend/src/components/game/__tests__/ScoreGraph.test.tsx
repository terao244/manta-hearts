import { render, screen } from '@testing-library/react';
import { ScoreGraph } from '../ScoreGraph';
import { PlayerInfo, ScoreHistoryEntry } from '@/types';

// Chart.jsのモック
jest.mock('react-chartjs-2', () => ({
  Line: jest.fn(({ data, options }) => (
    <div data-testid="score-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ))
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

describe('ScoreGraph', () => {
  const mockPlayers: PlayerInfo[] = [
    { id: 1, displayName: 'プレイヤー1' },
    { id: 2, displayName: 'プレイヤー2' },
    { id: 3, displayName: 'プレイヤー3' },
    { id: 4, displayName: 'プレイヤー4' },
  ];

  const mockScoreHistory: ScoreHistoryEntry[] = [
    { hand: 1, scores: { 1: 0, 2: 0, 3: 0, 4: 0 } },
    { hand: 2, scores: { 1: 5, 2: 3, 3: 8, 4: 2 } },
    { hand: 3, scores: { 1: 10, 2: 8, 3: 15, 4: 7 } },
  ];

  it('スコアグラフが正しくレンダリングされる', () => {
    render(
      <ScoreGraph 
        players={mockPlayers}
        scoreHistory={mockScoreHistory}
      />
    );

    expect(screen.getByTestId('score-chart')).toBeInTheDocument();
    expect(screen.getByText('現在のスコア')).toBeInTheDocument();
  });

  it('プレイヤー数が正しく反映される', () => {
    render(
      <ScoreGraph 
        players={mockPlayers}
        scoreHistory={mockScoreHistory}
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    expect(chartData.datasets).toHaveLength(4);
    expect(chartData.datasets[0].label).toBe('プレイヤー1');
    expect(chartData.datasets[1].label).toBe('プレイヤー2');
    expect(chartData.datasets[2].label).toBe('プレイヤー3');
    expect(chartData.datasets[3].label).toBe('プレイヤー4');
  });

  it('スコア履歴が正しく反映される', () => {
    render(
      <ScoreGraph 
        players={mockPlayers}
        scoreHistory={mockScoreHistory}
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    expect(chartData.labels).toEqual(['ハンド 0', 'ハンド 1', 'ハンド 2', 'ハンド 3']);
    
    // プレイヤー1のスコア推移（ハンド0から開始）
    expect(chartData.datasets[0].data).toEqual([0, 0, 5, 10]);
    // プレイヤー2のスコア推移（ハンド0から開始）
    expect(chartData.datasets[1].data).toEqual([0, 0, 3, 8]);
    // プレイヤー3のスコア推移（ハンド0から開始）
    expect(chartData.datasets[2].data).toEqual([0, 0, 8, 15]);
    // プレイヤー4のスコア推移（ハンド0から開始）
    expect(chartData.datasets[3].data).toEqual([0, 0, 2, 7]);
  });

  it('各プレイヤーに異なる色が割り当てられる', () => {
    render(
      <ScoreGraph 
        players={mockPlayers}
        scoreHistory={mockScoreHistory}
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    const colors = chartData.datasets.map((dataset) => dataset.borderColor);
    
    // 各プレイヤーに異なる色が割り当てられていることを確認
    expect(colors).toHaveLength(4);
    expect(new Set(colors).size).toBe(4); // すべて異なる色
  });

  it('スコア履歴が空の場合でも正しく動作する', () => {
    render(
      <ScoreGraph 
        players={mockPlayers}
        scoreHistory={[]}
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    // 空の場合でもハンド0から開始
    expect(chartData.labels).toEqual(['ハンド 0']);
    expect(chartData.datasets[0].data).toEqual([0]);
  });

  it('グラフオプションが正しく設定される', () => {
    render(
      <ScoreGraph 
        players={mockPlayers}
        scoreHistory={mockScoreHistory}
      />
    );

    const chartOptions = JSON.parse(screen.getByTestId('chart-options').textContent || '{}');
    expect(chartOptions.responsive).toBe(true);
    expect(chartOptions.plugins.title.display).toBe(true);
    expect(chartOptions.plugins.title.text).toBe('スコア推移グラフ');
    expect(chartOptions.scales.y.min).toBe(0);
    expect(chartOptions.scales.y.title.text).toBe('累積スコア (点)');
    expect(chartOptions.scales.x.title.text).toBe('ハンド番号');
  });

  it('currentPlayerId が指定された場合、該当プレイヤーが強調される', () => {
    render(
      <ScoreGraph 
        players={mockPlayers}
        scoreHistory={mockScoreHistory}
        currentPlayerId={1}
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    
    // プレイヤー1（currentPlayer）は太い線で強調
    expect(chartData.datasets[0].borderWidth).toBe(4);
    // 他のプレイヤーは通常の太さ
    expect(chartData.datasets[1].borderWidth).toBe(2);
    expect(chartData.datasets[2].borderWidth).toBe(2);
    expect(chartData.datasets[3].borderWidth).toBe(2);
  });
});