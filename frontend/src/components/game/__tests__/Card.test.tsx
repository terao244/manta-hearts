import React from 'react';
import { render, screen, fireEvent } from '@/test-utils';
import { Card } from '../Card';
import type { CardInfo } from '@/types';

describe('Card', () => {
  const mockCard: CardInfo = {
    id: 1,
    suit: 'HEARTS',
    rank: 'ACE',
    code: 'AH',
    pointValue: 1,
    sortOrder: 1
  };

  const mockOnClick = jest.fn();
  const mockOnHover = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('カードの基本情報が表示される', () => {
    render(<Card card={mockCard} />);
    
    expect(screen.getAllByText('A')).toHaveLength(2); // 上下に表示されるため2つ
    expect(screen.getAllByText('♥')).toHaveLength(3); // 左上、中央、右下で3つ
  });

  it('クリック可能な状態でクリックハンドラが動作する', () => {
    render(<Card card={mockCard} onClick={mockOnClick} isPlayable={true} />);
    
    const cardElement = screen.getByRole('button');
    fireEvent.click(cardElement);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('選択状態のスタイルが適用される', () => {
    render(<Card card={mockCard} isSelected={true} />);
    
    const cardElement = screen.getByTestId('card');
    expect(cardElement).toHaveClass('ring-blue-500');
  });

  it('プレイ不可能な状態のスタイルが適用される', () => {
    render(<Card card={mockCard} isPlayable={false} />);
    
    const cardElement = screen.getByTestId('card');
    expect(cardElement).toHaveClass('opacity-50');
  });

  it('ホバーハンドラが動作する', () => {
    render(<Card card={mockCard} onHover={mockOnHover} />);
    
    const cardElement = screen.getByTestId('card');
    fireEvent.mouseEnter(cardElement);
    
    expect(mockOnHover).toHaveBeenCalledTimes(1);
  });

  it('スペードのクイーンに特別なスタイルが適用される', () => {
    const queenOfSpades: CardInfo = {
      id: 39,
      suit: 'SPADES',
      rank: 'QUEEN',
      code: 'QS',
      pointValue: 13,
      sortOrder: 39
    };

    render(<Card card={queenOfSpades} />);
    
    const cardElement = screen.getByTestId('card');
    expect(cardElement).toHaveClass('border-red-500');
  });

  it('ハートカードに特別なスタイルが適用される', () => {
    render(<Card card={mockCard} />);
    
    const cardElement = screen.getByTestId('card');
    expect(cardElement).toHaveClass('border-red-400');
  });

  it('サイズプロパティが適用される', () => {
    render(<Card card={mockCard} size="large" />);
    
    const cardElement = screen.getByTestId('card');
    expect(cardElement).toHaveClass('w-20', 'h-28');
  });

  it('スートシンボルが正しく表示される', () => {
    const testCases = [
      { suit: 'HEARTS' as const, symbol: '♥' },
      { suit: 'DIAMONDS' as const, symbol: '♦' },
      { suit: 'CLUBS' as const, symbol: '♣' },
      { suit: 'SPADES' as const, symbol: '♠' }
    ];

    testCases.forEach(({ suit, symbol }) => {
      const card: CardInfo = { ...mockCard, suit };
      const { unmount } = render(<Card card={card} />);
      
      expect(screen.getAllByText(symbol).length).toBeGreaterThan(0);
      unmount();
    });
  });

  it('ランク表示が正しく変換される', () => {
    const testCases = [
      { rank: 'ACE' as const, display: 'A' },
      { rank: 'JACK' as const, display: 'J' },
      { rank: 'QUEEN' as const, display: 'Q' },
      { rank: 'KING' as const, display: 'K' },
      { rank: 'TEN' as const, display: '10' }
    ];

    testCases.forEach(({ rank, display }) => {
      const card: CardInfo = { ...mockCard, rank };
      const { unmount } = render(<Card card={card} />);
      
      expect(screen.getAllByText(display).length).toBeGreaterThan(0);
      unmount();
    });
  });
});