import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmoteButtons } from '../EmoteButtons';
import { GameState, EmoteType } from '../../../types';

// モックソケット
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true,
};

// テスト用のGameState
const createGameState = (phase: string): GameState => ({
  gameId: 1,
  status: 'PLAYING',
  players: [
    { id: 1, name: 'Player1', displayName: 'Player1', displayOrder: 1, isActive: true },
    { id: 2, name: 'Player2', displayName: 'Player2', displayOrder: 2, isActive: true },
    { id: 3, name: 'Player3', displayName: 'Player3', displayOrder: 3, isActive: true },
    { id: 4, name: 'Player4', displayName: 'Player4', displayOrder: 4, isActive: true },
  ],
  currentHand: 1,
  currentTrick: 1,
  currentTurn: 1,
  phase: phase as 'waiting' | 'dealing' | 'exchanging' | 'playing' | 'completed',
  heartsBroken: false,
  tricks: [],
  scores: {},
});

describe('EmoteButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render three emote buttons when game is in playing phase', () => {
      const gameState = createGameState('playing');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      // 3つのエモートボタンが表示される
      expect(screen.getByRole('button', { name: /👎/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔥/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🚮/ })).toBeInTheDocument();
    });

    it('should render three emote buttons when game is in exchanging phase', () => {
      const gameState = createGameState('exchanging');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      // 交換フェーズでも表示される
      expect(screen.getByRole('button', { name: /👎/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔥/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🚮/ })).toBeInTheDocument();
    });

    it('should not render buttons when game is in waiting phase', () => {
      const gameState = createGameState('waiting');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      // 待機フェーズでは表示されない
      expect(screen.queryByRole('button', { name: /👎/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /🔥/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /🚮/ })).not.toBeInTheDocument();
    });

    it('should not render buttons when game is in dealing phase', () => {
      const gameState = createGameState('dealing');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      // 配布フェーズでは表示されない
      expect(screen.queryByRole('button', { name: /👎/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /🔥/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /🚮/ })).not.toBeInTheDocument();
    });

    it('should not render buttons when game is completed', () => {
      const gameState = createGameState('completed');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      // 完了フェーズでは表示されない
      expect(screen.queryByRole('button', { name: /👎/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /🔥/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /🚮/ })).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should emit sendEmote event with thumbs down when thumbs down button is clicked', () => {
      const gameState = createGameState('playing');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      const thumbsDownButton = screen.getByRole('button', { name: /👎/ });
      fireEvent.click(thumbsDownButton);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('sendEmote', '👎');
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    });

    it('should emit sendEmote event with fire when fire button is clicked', () => {
      const gameState = createGameState('playing');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      const fireButton = screen.getByRole('button', { name: /🔥/ });
      fireEvent.click(fireButton);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('sendEmote', '🔥');
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    });

    it('should emit sendEmote event with trash when trash button is clicked', () => {
      const gameState = createGameState('playing');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      const trashButton = screen.getByRole('button', { name: /🚮/ });
      fireEvent.click(trashButton);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('sendEmote', '🚮');
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    });

    it('should send correct emote types for all three buttons', () => {
      const gameState = createGameState('playing');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      // 各ボタンをクリックして正しいエモートタイプが送信されることを確認
      const emoteButtons = [
        { selector: /👎/, expectedEmote: '👎' as EmoteType },
        { selector: /🔥/, expectedEmote: '🔥' as EmoteType },
        { selector: /🚮/, expectedEmote: '🚮' as EmoteType },
      ];
      
      emoteButtons.forEach(({ selector, expectedEmote }, index) => {
        const button = screen.getByRole('button', { name: selector });
        fireEvent.click(button);
        
        expect(mockSocket.emit).toHaveBeenNthCalledWith(index + 1, 'sendEmote', expectedEmote);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple clicks on the same button', () => {
      const gameState = createGameState('playing');
      
      render(<EmoteButtons socket={mockSocket} gameState={gameState} />);
      
      const fireButton = screen.getByRole('button', { name: /🔥/ });
      
      // 同じボタンを複数回クリック
      fireEvent.click(fireButton);
      fireEvent.click(fireButton);
      fireEvent.click(fireButton);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('sendEmote', '🔥');
      expect(mockSocket.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('Socket connection', () => {
    it('should not emit events when socket is not provided', () => {
      const gameState = createGameState('playing');
      
      render(<EmoteButtons socket={null} gameState={gameState} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        fireEvent.click(button);
      });
      
      // ソケットがnullの場合はemitが呼ばれない
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should not emit events when socket is disconnected', () => {
      const disconnectedSocket = {
        ...mockSocket,
        connected: false,
      };
      
      const gameState = createGameState('playing');
      
      render(<EmoteButtons socket={disconnectedSocket} gameState={gameState} />);
      
      const fireButton = screen.getByRole('button', { name: /🔥/ });
      fireEvent.click(fireButton);
      
      // 切断されたソケットの場合はemitが呼ばれない
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});