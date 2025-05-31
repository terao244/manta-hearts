import React from 'react';
import { render, screen } from '@/test-utils';
import { GameBoard } from '../GameBoard';
import type { GameState, PlayerInfo, CardInfo } from '@/types';

// Next.js Imageコンポーネントのモック
jest.mock('next/image', () => {
  return function MockedImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  };
});

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
      expect(screen.getAllByText(player.displayName).length).toBeGreaterThan(0);
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
    
    expect(screen.getAllByText('0点')).toHaveLength(4); // プレイヤー1と4がテーブル配置とスコア一覧で各2回
    expect(screen.getAllByText('5点')).toHaveLength(2); // テーブル配置とスコア一覧
    expect(screen.getAllByText('10点')).toHaveLength(2); // テーブル配置とスコア一覧
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
    const playerCard = currentPlayerElement.querySelector('div');
    expect(playerCard).toHaveClass('ring-blue-500');
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
    
    // 画像表示の場合はaltテキストで確認
    expect(screen.getByAltText('HEARTS ACE')).toBeInTheDocument();
    expect(screen.getByAltText('CLUBS TWO')).toBeInTheDocument();
    expect(screen.getByAltText('SPADES QUEEN')).toBeInTheDocument();
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
    
    expect(screen.getByText(/交換するカードを3枚選択してください/)).toBeInTheDocument();
  });

  it('トリック情報が表示される', () => {
    const gameStateWithTricks = {
      ...mockGameState,
      tricks: [{
        trickNumber: 1,
        cards: [
          { 
            playerId: 1, 
            card: { id: 1, suit: 'HEARTS', rank: 'ACE', code: 'AH', pointValue: 1, sortOrder: 1 }
          },
          { 
            playerId: 2, 
            card: { id: 14, suit: 'CLUBS', rank: 'TWO', code: '2C', pointValue: 0, sortOrder: 14 }
          }
        ],
        winnerId: 1,
        points: 1,
        isCompleted: true
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
    
    expect(screen.getAllByText('ゲーム終了')).toHaveLength(2); // ヘッダーとゲーム状態エリア
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
    
    expect(screen.getAllByText('他のプレイヤーを待っています...')).toHaveLength(2); // ヘッダーとゲーム状態エリア
  });

  it('現在の手番プレイヤーが強調表示される', () => {
    render(
      <GameBoard 
        gameState={mockGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    const currentTurnPlayerElement = screen.getByTestId('player-1');
    const playerCard = currentTurnPlayerElement.querySelector('div');
    expect(playerCard).toHaveClass('animate-pulse');
    expect(screen.getByText('手番')).toBeInTheDocument();
  });

  it('手番でないプレイヤーのメッセージが表示される', () => {
    const gameStateWithDifferentTurn = {
      ...mockGameState,
      currentTurn: 2 // プレイヤー2の手番
    };

    render(
      <GameBoard 
        gameState={gameStateWithDifferentTurn}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getAllByText('他のプレイヤーの番です')).toHaveLength(2);
  });

  it('自分の手番時にメッセージが強調表示される', () => {
    render(
      <GameBoard 
        gameState={mockGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getAllByText('あなたの番です')).toHaveLength(2);
    expect(screen.getByText('👆')).toBeInTheDocument();
  });
});