import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerSelect } from '../PlayerSelect';
import { fetchPlayersWithRetry } from '../../../lib/api/games';

// API関数をモック
jest.mock('../../../lib/api/games', () => ({
  fetchPlayersWithRetry: jest.fn(),
}));

const mockFetchPlayersWithRetry = fetchPlayersWithRetry as jest.MockedFunction<typeof fetchPlayersWithRetry>;


describe('PlayerSelect', () => {
  const mockOnPlayerSelect = jest.fn();

  const mockPlayersData = [
    { id: 1, name: 'プレイヤー1', displayName: 'プレイヤー1', displayOrder: 1, isActive: true },
    { id: 2, name: 'プレイヤー2', displayName: 'プレイヤー2', displayOrder: 2, isActive: true },
    { id: 3, name: 'プレイヤー3', displayName: 'プレイヤー3', displayOrder: 3, isActive: true },
    { id: 4, name: 'プレイヤー4', displayName: 'プレイヤー4', displayOrder: 4, isActive: true },
  ];

  beforeEach(() => {
    mockOnPlayerSelect.mockClear();
    mockFetchPlayersWithRetry.mockResolvedValue(mockPlayersData);
  });

  it('プレイヤー選択画面を正しく表示する', async () => {
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={false}
      />
    );

    expect(screen.getByText('ハーツゲーム')).toBeInTheDocument();
    expect(screen.getByText('プレイヤーを選択すると自動的にゲームに参加します')).toBeInTheDocument();
    
    // プレイヤーデータの読み込みを待つ
    await waitFor(() => {
      expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー2')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー3')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー4')).toBeInTheDocument();
    });
  });

  it('プレイヤーボタンをクリックすると自動参加フローが開始される', async () => {
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={false}
      />
    );

    // プレイヤーデータの読み込みを待つ
    await waitFor(() => {
      expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
    });

    const player1Button = screen.getByText('プレイヤー1');
    fireEvent.click(player1Button);

    await waitFor(() => {
      expect(mockOnPlayerSelect).toHaveBeenCalledWith(1);
    });
  });

  it('ローディング中は適切なメッセージを表示する', async () => {
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={true}
      />
    );

    // プレイヤーデータの読み込みを待つ
    await waitFor(() => {
      expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
    });

    expect(screen.getByText('ゲームに参加中...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'プレイヤー1' })).toBeDisabled();
  });

  it('エラーメッセージを表示する', () => {
    const errorMessage = 'ネットワークエラーが発生しました';
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={false}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('ローディング中はすべてのボタンが無効化される', async () => {
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={true}
      />
    );

    // プレイヤーデータの読み込みを待つ
    await waitFor(() => {
      expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'プレイヤー1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'プレイヤー2' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'プレイヤー3' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'プレイヤー4' })).toBeDisabled();
  });

  it('各プレイヤーボタンが正しく動作する', async () => {
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={false}
      />
    );

    // プレイヤーデータの読み込みを待つ
    await waitFor(() => {
      expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
    });

    const playerNames = ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4'];
    const expectedIds = [1, 2, 3, 4];
    
    for (let i = 0; i < playerNames.length; i++) {
      const button = screen.getByText(playerNames[i]);
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockOnPlayerSelect).toHaveBeenCalledWith(expectedIds[i]);
      });
      
      mockOnPlayerSelect.mockClear();
    }
  });
});