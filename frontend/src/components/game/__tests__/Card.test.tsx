import React from 'react';
import { render, screen, fireEvent } from '@/test-utils';
import { Card } from '../Card';
import type { CardInfo } from '@/types';

// Next.js Imageコンポーネントのモック
jest.mock('next/image', () => {
  return function MockedImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  };
});

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
    
    // 画像表示の場合はaltテキストで確認
    const imageElement = screen.getByAltText('HEARTS ACE');
    expect(imageElement).toBeInTheDocument();
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
      { suit: 'HEARTS' as const, expectedPath: '/cards/heart_A.svg' },
      { suit: 'DIAMONDS' as const, expectedPath: '/cards/diamond_A.svg' },
      { suit: 'CLUBS' as const, expectedPath: '/cards/club_A.svg' },
      { suit: 'SPADES' as const, expectedPath: '/cards/spade_A.svg' }
    ];

    testCases.forEach(({ suit, expectedPath }) => {
      const card: CardInfo = { ...mockCard, suit };
      const { unmount } = render(<Card card={card} />);
      
      const imageElement = screen.getByAltText(`${suit} ACE`);
      expect(imageElement).toHaveAttribute('src', expectedPath);
      unmount();
    });
  });

  it('ランク表示が正しく変換される', () => {
    const testCases = [
      { rank: 'ACE' as const, expectedPath: '/cards/heart_A.svg' },
      { rank: 'JACK' as const, expectedPath: '/cards/heart_J.svg' },
      { rank: 'QUEEN' as const, expectedPath: '/cards/heart_Q.svg' },
      { rank: 'KING' as const, expectedPath: '/cards/heart_K.svg' },
      { rank: 'TEN' as const, expectedPath: '/cards/heart_10.svg' }
    ];

    testCases.forEach(({ rank, expectedPath }) => {
      const card: CardInfo = { ...mockCard, rank };
      const { unmount } = render(<Card card={card} />);
      
      const imageElement = screen.getByAltText(`HEARTS ${rank}`);
      expect(imageElement).toHaveAttribute('src', expectedPath);
      unmount();
    });
  });

  it('カード画像が表示される', () => {
    render(<Card card={mockCard} />);
    
    const imageElement = screen.getByAltText('HEARTS ACE');
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute('src', '/cards/heart_A.svg');
  });

  it('画像読み込みエラー時にフォールバック表示される', () => {
    render(<Card card={mockCard} />);
    
    const imageElement = screen.getByAltText('HEARTS ACE');
    
    // 画像エラーをシミュレート
    fireEvent.error(imageElement);
    
    // フォールバック表示の確認
    expect(screen.getAllByText('A')).toHaveLength(2);
    expect(screen.getAllByText('♥')).toHaveLength(3);
  });

  it('異なるサイズで正しい画像サイズが設定される', () => {
    const { rerender } = render(<Card card={mockCard} size="small" />);
    
    let imageElement = screen.getByAltText('HEARTS ACE');
    expect(imageElement).toHaveAttribute('width', '48');
    expect(imageElement).toHaveAttribute('height', '64');
    
    rerender(<Card card={mockCard} size="large" />);
    
    imageElement = screen.getByAltText('HEARTS ACE');
    expect(imageElement).toHaveAttribute('width', '80');
    expect(imageElement).toHaveAttribute('height', '112');
  });
});