import React from 'react';
import { render, screen, fireEvent } from '@/test-utils';
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
    expect(screen.getByText('ゲーム#1 | ハンド: 1 | トリック: 1')).toBeInTheDocument();
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
    
    expect(screen.getAllByText('0点 / +0点')).toHaveLength(2); // プレイヤー1と4がテーブル配置で表示
    expect(screen.getAllByText('5点 / +0点')).toHaveLength(1); // プレイヤー2がテーブル配置で表示
    expect(screen.getAllByText('10点 / +0点')).toHaveLength(1); // プレイヤー3がテーブル配置で表示
  });

  it('現在ハンドスコアが表示される', () => {
    const gameStateWithHandScores: GameState = {
      ...mockGameState,
      currentHandScores: { 1: 3, 2: 0, 3: 13, 4: 0 }
    };

    render(
      <GameBoard 
        gameState={gameStateWithHandScores}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getByText('0点 / +3点')).toBeInTheDocument(); // プレイヤー1の現在ハンドスコア
    expect(screen.getByText('10点 / +13点')).toBeInTheDocument(); // プレイヤー3の現在ハンドスコア
    expect(screen.getAllByText('5点 / +0点')).toHaveLength(1); // プレイヤー2
    expect(screen.getAllByText('0点 / +0点')).toHaveLength(1); // プレイヤー4
  });

  it('現在ハンドスコアが未定義の場合も0点として表示される', () => {
    // currentHandScoresが未定義の場合
    render(
      <GameBoard 
        gameState={mockGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnCardExchange}
      />
    );
    
    expect(screen.getAllByText('0点 / +0点')).toHaveLength(2); // プレイヤー1と4に0点が表示される
    expect(screen.getAllByText('5点 / +0点')).toHaveLength(1); // プレイヤー2
    expect(screen.getAllByText('10点 / +0点')).toHaveLength(1); // プレイヤー3
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
    
    expect(screen.getAllByText('交換するカードを3枚選んでください').length).toBeGreaterThan(0);
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
    
    expect(screen.getAllByText('ゲーム終了')).toHaveLength(1); // ヘッダーのみ
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
    
    expect(screen.getAllByText('他のプレイヤーを待っています...')).toHaveLength(1); // ヘッダーのみ
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
    
    expect(screen.getAllByText('他のプレイヤーの番です')).toHaveLength(1);
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
    
    expect(screen.getAllByText('あなたの番です')).toHaveLength(1);
    expect(screen.getByText('👆')).toBeInTheDocument();
  });

  it('確認ボタンが3枚選択時に表示される', () => {
    const mockOnExchange = jest.fn();
    const exchangeGameState = {
      ...mockGameState,
      phase: 'exchanging' as const
    };

    render(
      <GameBoard 
        gameState={exchangeGameState}
        currentPlayerId={1}
        onCardPlay={mockOnCardPlay}
        onCardExchange={mockOnExchange}
      />
    );
    
    // 3枚のカードを選択する
    const cardElements = screen.getAllByRole('button').filter(button => 
      button.getAttribute('data-testid') === 'card'
    );
    
    // 最初の3枚のカードをクリック
    fireEvent.click(cardElements[0]);
    fireEvent.click(cardElements[1]);
    fireEvent.click(cardElements[2]);
    
    // 3枚選択後に確認ボタンが表示されることを確認
    const confirmButton = screen.getByText('🔄 交換確定');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).not.toBeDisabled();
  });

  describe('同点継続UI制御テスト', () => {
    it('同点継続時はゲーム終了モーダルを表示しない', () => {
      const tiedGameState = {
        ...mockGameState,
        status: 'FINISHED' as const,
        phase: 'completed' as const,
        // 2人同点の状態をシミュレート
        scores: { 1: 100, 2: 85, 3: 85, 4: 95 }
      };

      render(
        <GameBoard 
          gameState={tiedGameState}
          currentPlayerId={1}
          onCardPlay={mockOnCardPlay}
          onCardExchange={mockOnCardExchange}
          isGameCompleted={false} // 同点継続時はfalse
          gameResult={undefined} // 同点継続時はundefined
        />
      );
      
      // ゲーム終了モーダルが表示されないことを確認
      expect(screen.queryByTestId('game-end-modal')).not.toBeInTheDocument();
      
      // 通常のゲーム状態表示は維持されることを確認
      expect(screen.getAllByText('ゲーム終了')).toHaveLength(1);
    });

    it('勝者確定時はゲーム終了モーダルを表示する', () => {
      const finishedGameState = {
        ...mockGameState,
        status: 'FINISHED' as const,
        phase: 'completed' as const,
        scores: { 1: 100, 2: 85, 3: 95, 4: 110 }
      };

      const mockGameResult = {
        gameId: 1,
        finalScores: { 1: 100, 2: 85, 3: 95, 4: 110 },
        winnerId: 2,
        completedAt: '2025-01-09T10:00:00Z',
        scoreHistory: [],
        rankings: [
          { playerId: 2, rank: 1, score: 85 },
          { playerId: 3, rank: 2, score: 95 },
          { playerId: 1, rank: 3, score: 100 },
          { playerId: 4, rank: 4, score: 110 }
        ]
      };

      render(
        <GameBoard 
          gameState={finishedGameState}
          currentPlayerId={1}
          onCardPlay={mockOnCardPlay}
          onCardExchange={mockOnCardExchange}
          isGameCompleted={true} // 勝者確定時はtrue
          gameResult={mockGameResult} // 勝者確定時はGameResult設定
        />
      );
      
      // ゲーム終了モーダルが表示されることを確認
      expect(screen.getByTestId('game-end-modal')).toBeInTheDocument();
    });

    it('同点継続時に継続メッセージが表示される', () => {
      const tiedGameState = {
        ...mockGameState,
        status: 'FINISHED' as const,
        phase: 'completed' as const,
        scores: { 1: 100, 2: 85, 3: 85, 4: 95 }
      };

      render(
        <GameBoard 
          gameState={tiedGameState}
          currentPlayerId={1}
          onCardPlay={mockOnCardPlay}
          onCardExchange={mockOnCardExchange}
          isGameCompleted={false}
          gameResult={undefined}
          isTieContinuation={true} // 同点継続フラグ
        />
      );
      
      // 同点継続メッセージが表示されることを確認
      expect(screen.getByText('同点のため次のハンドに進みます')).toBeInTheDocument();
      expect(screen.getByTestId('tie-continuation-message')).toBeInTheDocument();
    });

    it('3人同点時に継続メッセージが表示される', () => {
      const threeTiedGameState = {
        ...mockGameState,
        status: 'FINISHED' as const,
        phase: 'completed' as const,
        scores: { 1: 100, 2: 85, 3: 85, 4: 85 }
      };

      render(
        <GameBoard 
          gameState={threeTiedGameState}
          currentPlayerId={1}
          onCardPlay={mockOnCardPlay}
          onCardExchange={mockOnCardExchange}
          isGameCompleted={false}
          gameResult={undefined}
          isTieContinuation={true}
        />
      );
      
      expect(screen.getByText('同点のため次のハンドに進みます')).toBeInTheDocument();
      expect(screen.getByTestId('tie-continuation-message')).toBeInTheDocument();
    });

    it('4人同点時に継続メッセージが表示される', () => {
      const fourTiedGameState = {
        ...mockGameState,
        status: 'FINISHED' as const,
        phase: 'completed' as const,
        scores: { 1: 85, 2: 85, 3: 85, 4: 85 }
      };

      render(
        <GameBoard 
          gameState={fourTiedGameState}
          currentPlayerId={1}
          onCardPlay={mockOnCardPlay}
          onCardExchange={mockOnCardExchange}
          isGameCompleted={false}
          gameResult={undefined}
          isTieContinuation={true}
        />
      );
      
      expect(screen.getByText('同点のため次のハンドに進みます')).toBeInTheDocument();
      expect(screen.getByTestId('tie-continuation-message')).toBeInTheDocument();
    });

    it('同点継続フラグが無い場合は継続メッセージを表示しない', () => {
      const tiedGameState = {
        ...mockGameState,
        status: 'FINISHED' as const,
        phase: 'completed' as const,
        scores: { 1: 100, 2: 85, 3: 85, 4: 95 }
      };

      render(
        <GameBoard 
          gameState={tiedGameState}
          currentPlayerId={1}
          onCardPlay={mockOnCardPlay}
          onCardExchange={mockOnCardExchange}
          isGameCompleted={false}
          gameResult={undefined}
          // isTieContinuationプロパティなし
        />
      );
      
      // 継続メッセージが表示されないことを確認
      expect(screen.queryByText('同点のため次のハンドに進みます')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tie-continuation-message')).not.toBeInTheDocument();
    });

    it('同点継続時のスコア表示が正しく強調される', () => {
      const tiedGameState = {
        ...mockGameState,
        status: 'FINISHED' as const,
        phase: 'completed' as const,
        scores: { 1: 100, 2: 85, 3: 85, 4: 95 }
      };

      render(
        <GameBoard 
          gameState={tiedGameState}
          currentPlayerId={1}
          onCardPlay={mockOnCardPlay}
          onCardExchange={mockOnCardExchange}
          isGameCompleted={false}
          gameResult={undefined}
          isTieContinuation={true}
        />
      );
      
      // 同点プレイヤーのスコアが強調表示されることを確認
      const tiedScoreElements = screen.getAllByTestId('tied-score');
      expect(tiedScoreElements).toHaveLength(2); // プレイヤー2と3が同点
    });
  });
});