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
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Q')).toBeInTheDocument();
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
    
    expect(mockOnCardSelect).toHaveBeenCalledWith(mockCards[0]);
  });

  it('カードプレイハンドラが動作する', () => {
    render(
      <Hand 
        cards={mockCards} 
        onCardPlay={mockOnCardPlay}
        mode="play"
        playableCardIds={[1]}
      />
    );
    
    const firstCard = screen.getAllByRole('button')[0];
    fireEvent.click(firstCard);
    
    expect(mockOnCardPlay).toHaveBeenCalledWith(mockCards[0]);
  });

  it('選択されたカードにハイライトが適用される', () => {
    render(
      <Hand 
        cards={mockCards} 
        selectedCardIds={[1]}
      />
    );
    
    const cardElements = screen.getAllByTestId('card');
    expect(cardElements[0]).toHaveClass('ring-blue-500');
  });

  it('プレイ不可能なカードが無効化される', () => {
    render(
      <Hand 
        cards={mockCards} 
        mode="play"
        playableCardIds={[1]}
      />
    );
    
    const cardElements = screen.getAllByTestId('card');
    expect(cardElements[1]).toHaveClass('opacity-50');
    expect(cardElements[2]).toHaveClass('opacity-50');
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
    
    expect(screen.getByText('3枚のカードを選択してください')).toBeInTheDocument();
  });

  it('確認ボタンが正しい条件で有効化される', () => {
    render(
      <Hand 
        cards={mockCards} 
        mode="exchange"
        selectedCardIds={[1, 14, 39]}
        maxSelectableCards={3}
        showConfirmButton={true}
      />
    );
    
    const confirmButton = screen.getByText('交換確定');
    expect(confirmButton).not.toBeDisabled();
  });

  it('カードが正しくソートされて表示される', () => {
    const unsortedCards = [...mockCards].reverse();
    render(<Hand cards={unsortedCards} />);
    
    const cardElements = screen.getAllByTestId('card');
    const ranks = cardElements.map(card => card.textContent?.charAt(0));
    
    expect(ranks).toEqual(['A', '2', 'Q']);
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
});