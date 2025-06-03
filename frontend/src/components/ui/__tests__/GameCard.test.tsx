import React from 'react';
import { render, screen } from '@testing-library/react';
import GameCard from '../GameCard';
import { GameData } from '../../../types';

// Next.js routerをモック
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('GameCard', () => {
  const mockFinishedGame: GameData = {
    id: 1,
    startTime: '2025-06-03T10:00:00Z',
    endTime: '2025-06-03T11:30:00Z',
    duration: 90,
    status: 'FINISHED',
    finalScores: { 1: 45, 2: 67, 3: 23, 4: 89 },
    winnerId: 3,
    players: [
      { id: 1, name: 'Player 1', position: 'North', finalScore: 45 },
      { id: 2, name: 'Player 2', position: 'East', finalScore: 67 },
      { id: 3, name: 'Player 3', position: 'South', finalScore: 23 },
      { id: 4, name: 'Player 4', position: 'West', finalScore: 89 },
    ],
  };

  const mockPlayingGame: GameData = {
    id: 2,
    startTime: '2025-06-03T12:00:00Z',
    status: 'PLAYING',
    finalScores: { 1: 15, 2: 22, 3: 8, 4: 31 },
    players: [
      { id: 1, name: 'Player A', position: 'North', finalScore: 15 },
      { id: 2, name: 'Player B', position: 'East', finalScore: 22 },
      { id: 3, name: 'Player C', position: 'South', finalScore: 8 },
      { id: 4, name: 'Player D', position: 'West', finalScore: 31 },
    ],
  };

  it('renders finished game card correctly', () => {
    render(<GameCard game={mockFinishedGame} />);

    // ゲーム情報
    expect(screen.getByText('ゲーム #1')).toBeInTheDocument();
    expect(screen.getByText('完了')).toBeInTheDocument();
    expect(screen.getByText('1時間30分')).toBeInTheDocument();

    // プレイヤー情報
    expect(screen.getAllByText('Player 1')).toHaveLength(1);
    expect(screen.getAllByText('Player 2')).toHaveLength(1);
    expect(screen.getAllByText('Player 3')).toHaveLength(2); // player list + winner display
    expect(screen.getAllByText('Player 4')).toHaveLength(1);

    // スコア
    expect(screen.getByText('45点')).toBeInTheDocument();
    expect(screen.getByText('67点')).toBeInTheDocument();
    expect(screen.getByText('23点')).toBeInTheDocument();
    expect(screen.getByText('89点')).toBeInTheDocument();

    // 勝者表示
    expect(screen.getByText('勝者:')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('renders playing game card correctly', () => {
    render(<GameCard game={mockPlayingGame} />);

    // ゲーム情報
    expect(screen.getByText('ゲーム #2')).toBeInTheDocument();
    expect(screen.getByText('プレイ中')).toBeInTheDocument();
    expect(screen.getByText('ゲーム進行中...')).toBeInTheDocument();

    // プレイヤー情報
    expect(screen.getByText('Player A')).toBeInTheDocument();
    expect(screen.getByText('Player B')).toBeInTheDocument();
    expect(screen.getByText('Player C')).toBeInTheDocument();
    expect(screen.getByText('Player D')).toBeInTheDocument();

    // 現在のスコア
    expect(screen.getByText('15点')).toBeInTheDocument();
    expect(screen.getByText('22点')).toBeInTheDocument();
    expect(screen.getByText('8点')).toBeInTheDocument();
    expect(screen.getByText('31点')).toBeInTheDocument();
  });

  it('displays winner crown for finished game', () => {
    render(<GameCard game={mockFinishedGame} />);

    // 王冠と勝者表示が表示される
    expect(screen.getByText('👑')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('links to game detail page', () => {
    render(<GameCard game={mockFinishedGame} />);

    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', '/history/1');
  });

  it('displays correct status badge colors', () => {
    const { rerender } = render(<GameCard game={mockFinishedGame} />);
    expect(screen.getByText('完了')).toHaveClass('bg-green-100', 'text-green-800');

    rerender(<GameCard game={mockPlayingGame} />);
    expect(screen.getByText('プレイ中')).toHaveClass('bg-blue-100', 'text-blue-800');

    const pausedGame = { ...mockFinishedGame, status: 'PAUSED' as const };
    rerender(<GameCard game={pausedGame} />);
    expect(screen.getByText('一時停止')).toHaveClass('bg-yellow-100', 'text-yellow-800');

    const abandonedGame = { ...mockFinishedGame, status: 'ABANDONED' as const };
    rerender(<GameCard game={abandonedGame} />);
    expect(screen.getByText('中断')).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('formats duration correctly', () => {
    // 90分のゲーム
    render(<GameCard game={mockFinishedGame} />);
    expect(screen.getByText('1時間30分')).toBeInTheDocument();

    // 45分のゲーム
    const shortGame = { ...mockFinishedGame, duration: 45 };
    const { rerender } = render(<GameCard game={shortGame} />);
    rerender(<GameCard game={shortGame} />);
    expect(screen.getByText('45分')).toBeInTheDocument();

    // durationがないゲーム
    const noDurationGame = { ...mockFinishedGame, duration: undefined };
    rerender(<GameCard game={noDurationGame} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});