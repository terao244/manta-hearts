import React from 'react';
import { render, screen } from '@/test-utils';
import { GameBoard } from '../GameBoard';
import type { GameState, PlayerInfo, CardInfo } from '@/types';

describe('GameBoard', () => {
  const mockPlayers: PlayerInfo[] = [
    { id: 1, name: 'Player1', displayName: 'プレイヤー1', displayOrder: 1, isActive: true },
    { id: 2, name: 'Player2', displayName: 'プレイヤー2', displayOrder: 2, isActive: true },
    { id: 3, name: 'Player3', displayName: 'プレイヤー3', displayOrder: 3, isActive: true },
    { id: 4, name: 'Player4', displayName: 'プレイヤー4', displayOrder: 4, isActive: true }
  ];

  const mockCards: CardInfo[] = [
    { id: 1, suit: 'HEARTS', rank: 'ACE', code: 'AH', pointValue: 1, sortOrder: 1 },
    { id: 14, suit: 'CLUBS', rank: 'TWO', code: '2C', pointValue: 0, sortOrder: 14 },
    { id: 39, suit: 'SPADES', rank: 'QUEEN', code: 'QS', pointValue: 13, sortOrder: 39 }
  ];

  const mockGameState: GameState = {
    gameId: 1,
    status: 'PLAYING',
    players: mockPlayers,
    currentHand: 1,
    currentTrick: 1,
    currentTurn: 1,
    phase: 'playing',
    heartsBroken: false,
    tricks: [],
    scores: { 1: 0, 2: 5, 3: 10, 4: 0 },
    handCards: { 1: mockCards }
  };

  const mockOnCardPlay = jest.fn();
  const mockOnCardExchange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ゲームボードが正しく表示される', () => {
    render(
      <GameBoard 
        gameState={mockGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getByText('ハーツゲーム')).toBeInTheDocument();
    expect(screen.getByText('ハンド: 1')).toBeInTheDocument();
    expect(screen.getByText('トリック: 1')).toBeInTheDocument();
  });

  it('プレイヤー情報が表示される', () => {
    render(
      <GameBoard 
        gameState={mockGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    mockPlayers.forEach(player => {
      expect(screen.getByText(player.displayName)).toBeInTheDocument();
    });
  });

  it('スコアが表示される', () => {
    render(
      <GameBoard 
        gameState={mockGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getAllByText('0点')).toHaveLength(2); // プレイヤー1と4
    expect(screen.getByText('5点')).toBeInTheDocument();
    expect(screen.getByText('10点')).toBeInTheDocument();
  });

  it('現在のプレイヤーがハイライトされる', () => {
    render(
      <GameBoard 
        gameState={mockGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    const currentPlayerElement = screen.getByTestId('player-1');
    expect(currentPlayerElement).toHaveClass('ring-blue-500');
  });

  it('ハートブレイク状態が表示される', () => {
    const gameStateWithHeartsBroken = {
      ...mockGameState,
      heartsBroken: true
    };

    render(
      <GameBoard 
        gameState={gameStateWithHeartsBroken}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getByText('ハートブレイク中')).toBeInTheDocument();
  });

  it('手札が表示される', () => {
    render(
      <GameBoard 
        gameState={mockGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Q').length).toBeGreaterThan(0);
  });

  it('交換フェーズでカード交換UIが表示される', () => {
    const exchangeGameState = {
      ...mockGameState,
      phase: 'exchanging' as const
    };

    render(
      <GameBoard 
        gameState={exchangeGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getByText('3枚のカードを選択してください')).toBeInTheDocument();
  });

  it('トリック情報が表示される', () => {
    const gameStateWithTricks = {
      ...mockGameState,
      tricks: [{
        trickNumber: 1,
        cards: [
          { playerId: 1, cardId: 1, trickNumber: 1, playOrder: 1 },
          { playerId: 2, cardId: 14, trickNumber: 1, playOrder: 2 }
        ],
        winnerId: 1,
        points: 1,
        leadPlayerId: 1
      }]
    };

    render(
      <GameBoard 
        gameState={gameStateWithTricks}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getByTestId('trick-area')).toBeInTheDocument();
  });

  it('ゲーム終了状態が表示される', () => {
    const finishedGameState = {
      ...mockGameState,
      status: 'FINISHED' as const,
      phase: 'completed' as const
    };

    render(
      <GameBoard 
        gameState={finishedGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getByText('ゲーム終了')).toBeInTheDocument();
  });

  it('待機状態が表示される', () => {
    const waitingGameState = {
      ...mockGameState,
      phase: 'waiting' as const
    };

    render(
      <GameBoard 
        gameState={waitingGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getByText('他のプレイヤーを待っています...')).toBeInTheDocument();
  });
});