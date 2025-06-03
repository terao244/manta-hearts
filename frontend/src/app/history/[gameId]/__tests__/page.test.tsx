import React from 'react';
import { render, screen } from '@testing-library/react';
import { useParams, usePathname } from 'next/navigation';
import GameDetailPage from '../page';

// Next.js navigation mocks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  usePathname: jest.fn(),
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('GameDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ gameId: '123' });
    mockUsePathname.mockReturnValue('/history/123');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders game detail page title with correct game ID', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('ゲーム詳細 #123')).toBeInTheDocument();
    expect(screen.getByText('このゲームの詳細情報と履歴を確認できます')).toBeInTheDocument();
  });

  it('renders breadcrumbs correctly with game ID', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('ゲーム履歴')).toBeInTheDocument();
    expect(screen.getByText('ゲーム #123')).toBeInTheDocument();
  });

  it('renders game information section', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('ゲーム情報')).toBeInTheDocument();
    expect(screen.getByText('開始日時')).toBeInTheDocument();
    expect(screen.getByText('終了日時')).toBeInTheDocument();
    expect(screen.getByText('ゲーム時間')).toBeInTheDocument();
    expect(screen.getByText('勝者')).toBeInTheDocument();
  });

  it('renders final results section', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('最終結果')).toBeInTheDocument();
    expect(screen.getByText('順位')).toBeInTheDocument();
    expect(screen.getByText('プレイヤー')).toBeInTheDocument();
    expect(screen.getByText('最終スコア')).toBeInTheDocument();
    expect(screen.getByText('位置')).toBeInTheDocument();
  });

  it('renders score chart section', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('スコア推移')).toBeInTheDocument();
    expect(screen.getByText('スコア推移グラフはAPIクライアント実装後に表示されます')).toBeInTheDocument();
  });

  it('renders hand history section', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('ハンド履歴')).toBeInTheDocument();
    expect(screen.getByText('ハンド履歴はAPIクライアント実装後に表示されます')).toBeInTheDocument();
  });

  it('renders back to history link', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('← ゲーム履歴に戻る')).toBeInTheDocument();
  });
});