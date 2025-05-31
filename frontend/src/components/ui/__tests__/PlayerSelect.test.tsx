import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerSelect } from '../PlayerSelect';


describe('PlayerSelect', () => {
  const mockOnPlayerSelect = jest.fn();

  beforeEach(() => {
    mockOnPlayerSelect.mockClear();
  });

  it('プレイヤー選択画面を正しく表示する', () => {
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={false}
      />
    );

    expect(screen.getByText('ハーツゲーム')).toBeInTheDocument();
    expect(screen.getByText('プレイヤーを選択すると自動的にゲームに参加します')).toBeInTheDocument();
    expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
    expect(screen.getByText('プレイヤー2')).toBeInTheDocument();
    expect(screen.getByText('プレイヤー3')).toBeInTheDocument();
    expect(screen.getByText('プレイヤー4')).toBeInTheDocument();
  });

  it('プレイヤーボタンをクリックすると自動参加フローが開始される', async () => {
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={false}
      />
    );

    const player1Button = screen.getByText('プレイヤー1');
    fireEvent.click(player1Button);

    await waitFor(() => {
      expect(mockOnPlayerSelect).toHaveBeenCalledWith('プレイヤー1');
    });
  });

  it('ローディング中は適切なメッセージを表示する', () => {
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={true}
      />
    );

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

  it('ローディング中はすべてのボタンが無効化される', () => {
    render(
      <PlayerSelect
        onPlayerSelect={mockOnPlayerSelect}
        isLoading={true}
      />
    );

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

    const players = ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4'];
    
    for (const playerName of players) {
      const button = screen.getByText(playerName);
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockOnPlayerSelect).toHaveBeenCalledWith(playerName);
      });
      
      mockOnPlayerSelect.mockClear();
    }
  });
});