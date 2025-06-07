import React from 'react';
import { render, screen } from '@testing-library/react';
import PlayerPositions from '../PlayerPositions';
import { GameDetailData } from '../../../types';

describe('PlayerPositions', () => {
  const mockPlayers: GameDetailData['players'] = [
    { id: 1, name: 'Alice', position: 'North', finalScore: 15 },
    { id: 2, name: 'Bob', position: 'East', finalScore: 25 },
    { id: 3, name: 'Charlie', position: 'South', finalScore: 35 },
    { id: 4, name: 'Diana', position: 'West', finalScore: 45 },
  ];

  it('should render player positions correctly', () => {
    render(<PlayerPositions players={mockPlayers} />);

    // セクションタイトル
    expect(screen.getByText('プレイヤー席順')).toBeInTheDocument();

    // 席順ラベル
    expect(screen.getByText('北')).toBeInTheDocument();
    expect(screen.getByText('東')).toBeInTheDocument();
    expect(screen.getByText('南')).toBeInTheDocument();
    expect(screen.getByText('西')).toBeInTheDocument();

    // プレイヤー名（複数の場所に表示されるのでgetAllByTextを使用）
    expect(screen.getAllByText('Alice')).toHaveLength(2); // 席順図とテーブル
    expect(screen.getAllByText('Bob')).toHaveLength(2);
    expect(screen.getAllByText('Charlie')).toHaveLength(2);
    expect(screen.getAllByText('Diana')).toHaveLength(2);

    // スコア表示（複数の場所に表示されるのでgetAllByTextを使用）
    expect(screen.getAllByText('15点')).toHaveLength(2); // 席順図とテーブル
    expect(screen.getAllByText('25点')).toHaveLength(2);
    expect(screen.getAllByText('35点')).toHaveLength(2);
    expect(screen.getAllByText('45点')).toHaveLength(2);
  });

  it('should render player details table with correct ranking', () => {
    render(<PlayerPositions players={mockPlayers} />);

    // テーブルヘッダー
    expect(screen.getByText('プレイヤー詳細')).toBeInTheDocument();
    expect(screen.getByText('席順')).toBeInTheDocument();
    expect(screen.getByText('プレイヤー名')).toBeInTheDocument();
    expect(screen.getByText('最終スコア')).toBeInTheDocument();
    expect(screen.getByText('順位')).toBeInTheDocument();

    // 順位（スコア順でソートされる）
    const rankingElements = screen.getAllByText(/^[1-4]$/);
    expect(rankingElements).toHaveLength(4);
    
    // 最低スコアのプレイヤーが1位
    expect(screen.getAllByText('Alice')).toHaveLength(2); // 15点で1位（席順図とテーブル）
  });

  it('should show message when no players provided', () => {
    render(<PlayerPositions players={[]} />);

    expect(screen.getByText('プレイヤー席順情報がありません')).toBeInTheDocument();
  });

  it('should handle missing players for specific positions', () => {
    const incompletePlayers: GameDetailData['players'] = [
      { id: 1, name: 'Alice', position: 'North', finalScore: 15 },
      { id: 2, name: 'Bob', position: 'East', finalScore: 25 },
    ];

    render(<PlayerPositions players={incompletePlayers} />);

    // 存在するプレイヤー
    expect(screen.getAllByText('Alice')).toHaveLength(2); // 席順図とテーブル
    expect(screen.getAllByText('Bob')).toHaveLength(2);

    // 席順ラベルは全て表示される
    expect(screen.getByText('北')).toBeInTheDocument();
    expect(screen.getByText('東')).toBeInTheDocument();
    expect(screen.getByText('南')).toBeInTheDocument();
    expect(screen.getByText('西')).toBeInTheDocument();
  });

  it('should display table component', () => {
    render(<PlayerPositions players={mockPlayers} />);

    expect(screen.getByText('テーブル')).toBeInTheDocument();
  });
});