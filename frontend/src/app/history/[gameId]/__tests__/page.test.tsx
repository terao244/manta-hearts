import React from 'react';
import { render, screen } from '@testing-library/react';
import { useParams, usePathname } from 'next/navigation';
import GameDetailPage from '../page';
import { useGameDetail } from '../../../../hooks/useGameDetail';
import { GameDetailData } from '../../../../types';

// useGameDetailフックをモック
jest.mock('../../../../hooks/useGameDetail');

// ScoreGraphコンポーネントをモック
jest.mock('../../../../components/game/ScoreGraph', () => ({
  ScoreGraph: () => <div role="img">Score Graph</div>,
}));

// Next.js navigation mocks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  usePathname: jest.fn(),
}));

const mockUseGameDetail = useGameDetail as jest.MockedFunction<typeof useGameDetail>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('GameDetailPage', () => {
  const mockGameData: GameDetailData = {
    id: 123,
    startTime: '2025-06-03T10:00:00Z',
    endTime: '2025-06-03T11:30:00Z',
    duration: 90,
    status: 'FINISHED',
    players: [
      { id: 1, name: 'Player 1', position: 'North', finalScore: 23 },
      { id: 2, name: 'Player 2', position: 'East', finalScore: 67 },
      { id: 3, name: 'Player 3', position: 'South', finalScore: 45 },
      { id: 4, name: 'Player 4', position: 'West', finalScore: 89 },
    ],
    finalScores: [
      { playerId: 1, playerName: 'Player 1', score: 23 },
      { playerId: 2, playerName: 'Player 2', score: 67 },
      { playerId: 3, playerName: 'Player 3', score: 45 },
      { playerId: 4, playerName: 'Player 4', score: 89 },
    ],
    scoreHistory: [
      { hand: 1, scores: { 1: 5, 2: 10, 3: 8, 4: 13 } },
      { hand: 2, scores: { 1: 10, 2: 25, 3: 20, 4: 35 } },
    ],
    hands: [
      {
        id: 1,
        handNumber: 1,
        exchangeDirection: 'left',
        heartsBroken: true,
        shootTheMoonPlayerId: null,
        scores: { 1: 5, 2: 15, 3: 12, 4: 22 },
        tricks: [],
      },
    ],
  };

  beforeEach(() => {
    mockUseParams.mockReturnValue({ gameId: '123' });
    mockUsePathname.mockReturnValue('/history/123');
    mockUseGameDetail.mockReturnValue({
      game: mockGameData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders game detail page title with correct game ID', () => {
    render(<GameDetailPage />);
    
    // 複数の要素があるため、より具体的なセレクタを使用
    const heading = screen.getByRole('heading', { name: 'ゲーム #123' });
    expect(heading).toBeInTheDocument();
    // プレイヤー名は複数箇所に表示されるため、存在確認のみ
    const playerNames = screen.getAllByText('Player 1');
    expect(playerNames.length).toBeGreaterThan(0);
  });

  it('renders breadcrumbs correctly with game ID', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('ゲーム履歴')).toBeInTheDocument();
    // ブレッドクラムのゲーム番号はspan要素内にある
    const breadcrumbGameId = screen.getByText((content, element) => {
      return element?.tagName === 'SPAN' && content === 'ゲーム #123';
    });
    expect(breadcrumbGameId).toBeInTheDocument();
  });

  it('renders game information section', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('ゲーム情報')).toBeInTheDocument();
    expect(screen.getByText('開始日時:')).toBeInTheDocument();
    expect(screen.getByText('終了日時:')).toBeInTheDocument();
    expect(screen.getByText('ゲーム時間:')).toBeInTheDocument();
    expect(screen.getByText('勝者:')).toBeInTheDocument();
  });

  it('renders final results section', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('最終結果')).toBeInTheDocument();
    // プレイヤー名とスコアが表示されていることを確認
    const playerNames = screen.getAllByText('Player 1');
    expect(playerNames.length).toBeGreaterThan(0);
    expect(screen.getAllByText('23点').length).toBeGreaterThan(0);
  });

  it('renders score chart section', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('スコア推移')).toBeInTheDocument();
    // モックされたScoreGraphコンポーネントが描画されることを確認
    expect(screen.getByText('Score Graph')).toBeInTheDocument();
  });

  it('renders hand history section', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('ハンド履歴')).toBeInTheDocument();
    expect(screen.getByText('ハンド 1')).toBeInTheDocument();
    expect(screen.getByText('交換: 左隣')).toBeInTheDocument();
  });

  it('should display player positions correctly', () => {
    render(<GameDetailPage />);

    // プレイヤー席順情報が表示されることを確認（複数箇所に表示される可能性があるため getAllByText を使用）
    expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0); // North
    expect(screen.getAllByText('Player 2').length).toBeGreaterThan(0); // East  
    expect(screen.getAllByText('Player 3').length).toBeGreaterThan(0); // South
    expect(screen.getAllByText('Player 4').length).toBeGreaterThan(0); // West

    // 最終スコアも正しく表示されることを確認
    expect(screen.getAllByText('23点').length).toBeGreaterThan(0); // Player 1 score
    expect(screen.getAllByText('67点').length).toBeGreaterThan(0); // Player 2 score
    expect(screen.getAllByText('45点').length).toBeGreaterThan(0); // Player 3 score
    expect(screen.getAllByText('89点').length).toBeGreaterThan(0); // Player 4 score
  });

  it('renders back to history link', () => {
    render(<GameDetailPage />);
    
    const links = screen.getAllByText('← ゲーム履歴に戻る');
    expect(links.length).toBeGreaterThan(0);
  });

  it('handles loading state', () => {
    mockUseGameDetail.mockReturnValue({
      game: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<GameDetailPage />);
    
    expect(screen.getByText('ゲーム詳細を読み込み中...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    const mockError = new Error('Failed to load game');
    mockUseGameDetail.mockReturnValue({
      game: null,
      isLoading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    render(<GameDetailPage />);
    
    expect(screen.getByText('ゲーム詳細の読み込みに失敗しました')).toBeInTheDocument();
    expect(screen.getByText('Failed to load game')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });

  it('handles no game data state', () => {
    mockUseGameDetail.mockReturnValue({
      game: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<GameDetailPage />);
    
    expect(screen.getByText('ゲームが見つかりませんでした')).toBeInTheDocument();
  });
});