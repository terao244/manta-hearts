import React from 'react';
import { render, screen, fireEvent } from '@/test-utils';
import { Hand } from '../Hand';
import type { CardInfo } from '@/types';

describe('Hand', () => {
  const mockCards: CardInfo[] = [
    {
      id: 1,
      suit: 'HEARTS',
      rank: 'ACE',
      code: 'AH',
      pointValue: 1,
      sortOrder: 1
    },
    {
      id: 14,
      suit: 'CLUBS',
      rank: 'TWO',
      code: '2C',
      pointValue: 0,
      sortOrder: 14
    },
    {
      id: 39,
      suit: 'SPADES',
      rank: 'QUEEN',
      code: 'QS',
      pointValue: 13,
      sortOrder: 39
    }
  ];

  const mockOnCardSelect = jest.fn();
  const mockOnCardPlay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('手札のカードが表示される', () => {
    render(<Hand cards={mockCards} />);
    
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Q').length).toBeGreaterThan(0);
  });

  it('カード選択ハンドラが動作する', () => {
    render(
      <Hand 
        cards={mockCards} 
        onCardSelect={mockOnCardSelect}
        mode="exchange"
      />
    );
    
    const firstCard = screen.getAllByRole('button')[0];
    fireEvent.click(firstCard);
    
    // ソート後の最初のカード（スペードのQ）で検証
    const sortedCards = [...mockCards].sort((a, b) => {
      const suitOrder = { 'SPADES': 1, 'HEARTS': 2, 'DIAMONDS': 3, 'CLUBS': 4 };
      const rankOrder = {
        'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 'SIX': 6, 'SEVEN': 7, 'EIGHT': 8,
        'NINE': 9, 'TEN': 10, 'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14
      };
      if (a.suit !== b.suit) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return rankOrder[a.rank] - rankOrder[b.rank];
    });
    expect(mockOnCardSelect).toHaveBeenCalledWith(sortedCards[0]);
  });

  it('カードプレイハンドラが動作する', () => {
    render(
      <Hand 
        cards={mockCards} 
        onCardPlay={mockOnCardPlay}
        mode="play"
        playableCardIds={[39]} // スペードのQがプレイ可能
      />
    );
    
    const firstCard = screen.getAllByRole('button')[0]; // ソート後の最初のカード（スペードのQ）
    fireEvent.click(firstCard);
    
    // プレイ可能なカード（スペードのQ）で検証
    const sortedCards = [...mockCards].sort((a, b) => {
      const suitOrder = { 'SPADES': 1, 'HEARTS': 2, 'DIAMONDS': 3, 'CLUBS': 4 };
      const rankOrder = {
        'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 'SIX': 6, 'SEVEN': 7, 'EIGHT': 8,
        'NINE': 9, 'TEN': 10, 'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14
      };
      if (a.suit !== b.suit) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return rankOrder[a.rank] - rankOrder[b.rank];
    });
    expect(mockOnCardPlay).toHaveBeenCalledWith(sortedCards[0]);
  });

  it('選択されたカードにハイライトが適用される', () => {
    render(
      <Hand 
        cards={mockCards} 
        selectedCardIds={[39]} // スペードのQが選択されている
      />
    );
    
    const cardElements = screen.getAllByTestId('card');
    expect(cardElements[0]).toHaveClass('ring-blue-500'); // ソート後の最初のカード
  });

  it('プレイ不可能なカードが無効化される', () => {
    render(
      <Hand 
        cards={mockCards} 
        mode="play"
        playableCardIds={[39]} // スペードのQのみプレイ可能
      />
    );
    
    const cardElements = screen.getAllByTestId('card');
    expect(cardElements[1]).toHaveClass('opacity-50'); // ハートのA（プレイ不可）
    expect(cardElements[2]).toHaveClass('opacity-50'); // クラブの2（プレイ不可）
  });

  it('交換モードで最大選択数を超えるとエラーメッセージが表示される', () => {
    render(
      <Hand 
        cards={mockCards} 
        mode="exchange"
        selectedCardIds={[1, 14, 39]}
        maxSelectableCards={3}
      />
    );
    
    expect(screen.getByText(/3枚のカードを選択しました/)).toBeInTheDocument();
  });

  it('確認ボタンが正しい条件で有効化される', () => {
    const mockOnConfirm = jest.fn();
    render(
      <Hand 
        cards={mockCards} 
        mode="exchange"
        selectedCardIds={[1, 14, 39]}
        maxSelectableCards={3}
        showConfirmButton={true}
        onConfirm={mockOnConfirm}
      />
    );
    
    const confirmButton = screen.getByText('🔄 交換確定');
    expect(confirmButton).not.toBeDisabled();
  });

  it('カードが正しくソートされて表示される', () => {
    const unsortedCards = [...mockCards].reverse();
    render(<Hand cards={unsortedCards} />);
    
    const cardElements = screen.getAllByTestId('card');
    const ranks = cardElements.map(card => card.textContent?.charAt(0));
    
    // 新しいソート順: スペード > ハート > クラブ = Q, A, 2
    expect(ranks).toEqual(['Q', 'A', '2']);
  });

  it('空の手札でもエラーが発生しない', () => {
    render(<Hand cards={[]} />);
    
    expect(screen.getByText('手札がありません')).toBeInTheDocument();
  });

  it('レスポンシブデザインが適用される', () => {
    render(<Hand cards={mockCards} />);
    
    const handContainer = screen.getByTestId('hand-container');
    expect(handContainer).toHaveClass('flex-wrap', 'justify-center');
  });

  it('手番でない時にカードがグレーアウトされる', () => {
    render(
      <Hand 
        cards={mockCards} 
        mode="play"
        isPlayerTurn={false}
      />
    );
    
    const handContainer = screen.getByTestId('hand-container');
    expect(handContainer).toHaveClass('bg-gray-100', 'opacity-60');
  });

  it('手番でない時にカードクリックが無効化される', () => {
    render(
      <Hand 
        cards={mockCards} 
        mode="play"
        isPlayerTurn={false}
        onCardPlay={mockOnCardPlay}
      />
    );
    
    const firstCard = screen.getAllByRole('button')[0];
    fireEvent.click(firstCard);
    
    expect(mockOnCardPlay).not.toHaveBeenCalled();
  });

  it('手番でない時に適切なメッセージが表示される', () => {
    render(
      <Hand 
        cards={mockCards} 
        mode="play"
        isPlayerTurn={false}
      />
    );
    
    expect(screen.getByText(/他のプレイヤーの手番です。お待ちください/)).toBeInTheDocument();
  });

  it('手番の時は正常にカードプレイできる', () => {
    render(
      <Hand 
        cards={mockCards} 
        mode="play"
        isPlayerTurn={true}
        onCardPlay={mockOnCardPlay}
        playableCardIds={[39]}
      />
    );
    
    const firstCard = screen.getAllByRole('button')[0];
    fireEvent.click(firstCard);
    
    const sortedCards = [...mockCards].sort((a, b) => {
      const suitOrder = { 'SPADES': 1, 'HEARTS': 2, 'DIAMONDS': 3, 'CLUBS': 4 };
      const rankOrder = {
        'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 'SIX': 6, 'SEVEN': 7, 'EIGHT': 8,
        'NINE': 9, 'TEN': 10, 'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14
      };
      if (a.suit !== b.suit) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return rankOrder[a.rank] - rankOrder[b.rank];
    });
    expect(mockOnCardPlay).toHaveBeenCalledWith(sortedCards[0]);
  });
});