import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import GameHistoryPage from '../page';
import useGameHistory from '../../../hooks/useGameHistory';
import { GameData } from '../../../types';

// Next.js navigation mocks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// カスタムフックをモック
jest.mock('../../../hooks/useGameHistory');

// GameCardコンポーネントをモック
jest.mock('../../../components/ui/GameCard', () => {
  return function MockGameCard({ game }: { game: GameData }) {
    return <div data-testid={`game-card-${game.id}`}>Game #{game.id}</div>;
  };
});

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseGameHistory = useGameHistory as jest.MockedFunction<typeof useGameHistory>;

describe('GameHistoryPage', () => {
  const mockGames: GameData[] = [
    {
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
    },
    {
      id: 2,
      startTime: '2025-06-03T12:00:00Z',
      status: 'PLAYING',
      finalScores: {},
      players: [
        { id: 1, name: 'Player 1', position: 'North', finalScore: 0 },
        { id: 2, name: 'Player 2', position: 'East', finalScore: 0 },
      ],
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  };

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/history');
    mockUseGameHistory.mockReturnValue({
      games: [],
      isLoading: false,
      error: null,
      pagination: mockPagination,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders game history page title correctly', () => {
    render(<GameHistoryPage />);
    
    expect(screen.getByRole('heading', { name: 'ゲーム履歴' })).toBeInTheDocument();
    expect(screen.getByText('過去のハーツゲームの結果を確認できます')).toBeInTheDocument();
  });

  it('renders breadcrumbs correctly', () => {
    render(<GameHistoryPage />);
    
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getAllByText('ゲーム履歴')).toHaveLength(2); // breadcrumb and title
  });

  it('renders filter and sort controls', () => {
    render(<GameHistoryPage />);
    
    expect(screen.getByText('ゲーム状況')).toBeInTheDocument();
    expect(screen.getByText('ソート順')).toBeInTheDocument();
    expect(screen.getByText('表示件数')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockUseGameHistory.mockReturnValue({
      games: [],
      isLoading: true,
      error: null,
      pagination: mockPagination,
      refetch: jest.fn(),
    });

    render(<GameHistoryPage />);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const mockRefetch = jest.fn();
    mockUseGameHistory.mockReturnValue({
      games: [],
      isLoading: false,
      error: new Error('Failed to fetch'),
      pagination: mockPagination,
      refetch: mockRefetch,
    });

    render(<GameHistoryPage />);
    
    expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    
    const retryButton = screen.getByText('再試行');
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no games exist', () => {
    render(<GameHistoryPage />);
    
    expect(screen.getByText('ゲーム履歴がありません')).toBeInTheDocument();
    expect(screen.getByText('ゲームをプレイすると、ここに履歴が表示されます')).toBeInTheDocument();
  });

  it('renders games when data is available', () => {
    mockUseGameHistory.mockReturnValue({
      games: mockGames,
      isLoading: false,
      error: null,
      pagination: mockPagination,
      refetch: jest.fn(),
    });

    render(<GameHistoryPage />);
    
    expect(screen.getByTestId('game-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('game-card-2')).toBeInTheDocument();
  });

  it('updates filters when controls are changed', () => {
    render(<GameHistoryPage />);
    
    // ゲーム状況フィルターを変更
    const statusSelect = screen.getByDisplayValue('すべて');
    fireEvent.change(statusSelect, { target: { value: 'FINISHED' } });
    
    // ソート順を変更
    const sortSelect = screen.getByDisplayValue('開始日時（新しい順）');
    fireEvent.change(sortSelect, { target: { value: 'endTime-asc' } });
    
    // 表示件数を変更
    const limitSelect = screen.getByDisplayValue('10件');
    fireEvent.change(limitSelect, { target: { value: '20' } });
    
    // useGameHistoryが適切なパラメータで呼ばれることを確認
    expect(mockUseGameHistory).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      status: 'FINISHED',
      sortBy: 'endTime',
      sortOrder: 'asc',
    });
  });

  it('renders pagination when multiple pages exist', () => {
    const multiPagePagination = {
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    };

    mockUseGameHistory.mockReturnValue({
      games: mockGames,
      isLoading: false,
      error: null,
      pagination: multiPagePagination,
      refetch: jest.fn(),
    });

    render(<GameHistoryPage />);
    
    expect(screen.getByText('前へ')).toBeInTheDocument();
    expect(screen.getByText('次へ')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays result count information', () => {
    // 25ゲームのうち10件を表示する設定
    const manyGames = Array.from({ length: 10 }, (_, i) => ({
      ...mockGames[0],
      id: i + 1,
    }));

    mockUseGameHistory.mockReturnValue({
      games: manyGames,
      isLoading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
      refetch: jest.fn(),
    });

    render(<GameHistoryPage />);
    
    // 検索結果情報セクションが存在することを確認
    const resultInfo = screen.getByText(/件中.*件を表示/);
    expect(resultInfo).toBeInTheDocument();
  });
});