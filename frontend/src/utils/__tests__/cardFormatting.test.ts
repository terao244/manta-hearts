import {
  formatCard,
  formatCardFromInfo,
  formatCardsFromInfo,
  formatCardShort,
  formatCardShortFromInfo,
  formatCardsCompact,
  formatCardsCompactFromInfo,
  getCardColorClass,
  getCardPoints,
  getCardSortOrder,
} from '../cardFormatting';
import { CardInfo } from '../../types';

describe('カード表記システム', () => {
  const mockCardInfo: CardInfo = {
    id: 1,
    suit: 'HEARTS',
    rank: 'ACE',
    code: 'heart_A',
    pointValue: 1,
    sortOrder: 101,
  };

  const mockSpadeQueen: CardInfo = {
    id: 2,
    suit: 'SPADES',
    rank: 'QUEEN',
    code: 'spade_Q',
    pointValue: 13,
    sortOrder: 212,
  };

  const mockClub: CardInfo = {
    id: 3,
    suit: 'CLUBS',
    rank: 'TEN',
    code: 'club_10',
    pointValue: 0,
    sortOrder: 10,
  };

  describe('formatCard', () => {
    it('スーツとランクから正しい表記を生成する', () => {
      const result = formatCard('HEARTS', 'ACE');
      expect(result.displayText).toBe('♥A');
      expect(result.color).toBe('red');
      expect(result.suit).toBe('HEARTS');
      expect(result.rank).toBe('ACE');
    });

    it('全てのスーツが正しく表示される', () => {
      expect(formatCard('SPADES', 'KING').displayText).toBe('♠K');
      expect(formatCard('HEARTS', 'QUEEN').displayText).toBe('♥Q');
      expect(formatCard('CLUBS', 'JACK').displayText).toBe('♣J');
      expect(formatCard('DIAMONDS', 'TEN').displayText).toBe('♦10');
    });

    it('全てのランクが正しく表示される', () => {
      expect(formatCard('SPADES', 'TWO').displayText).toBe('♠2');
      expect(formatCard('SPADES', 'THREE').displayText).toBe('♠3');
      expect(formatCard('SPADES', 'FOUR').displayText).toBe('♠4');
      expect(formatCard('SPADES', 'FIVE').displayText).toBe('♠5');
      expect(formatCard('SPADES', 'SIX').displayText).toBe('♠6');
      expect(formatCard('SPADES', 'SEVEN').displayText).toBe('♠7');
      expect(formatCard('SPADES', 'EIGHT').displayText).toBe('♠8');
      expect(formatCard('SPADES', 'NINE').displayText).toBe('♠9');
      expect(formatCard('SPADES', 'TEN').displayText).toBe('♠10');
      expect(formatCard('SPADES', 'JACK').displayText).toBe('♠J');
      expect(formatCard('SPADES', 'QUEEN').displayText).toBe('♠Q');
      expect(formatCard('SPADES', 'KING').displayText).toBe('♠K');
      expect(formatCard('SPADES', 'ACE').displayText).toBe('♠A');
    });

    it('無効なスーツでエラーを投げる', () => {
      expect(() => formatCard('INVALID', 'ACE')).toThrow('Invalid card: INVALID ACE');
    });

    it('無効なランクでエラーを投げる', () => {
      expect(() => formatCard('HEARTS', 'INVALID')).toThrow('Invalid card: HEARTS INVALID');
    });
  });

  describe('formatCardFromInfo', () => {
    it('CardInfo型から正しい表記を生成する', () => {
      const result = formatCardFromInfo(mockCardInfo);
      expect(result.displayText).toBe('♥A');
      expect(result.color).toBe('red');
    });
  });

  describe('formatCardsFromInfo', () => {
    it('CardInfo配列から正しい表記配列を生成する', () => {
      const cards = [mockCardInfo, mockSpadeQueen, mockClub];
      const results = formatCardsFromInfo(cards);
      
      expect(results).toHaveLength(3);
      expect(results[0].displayText).toBe('♥A');
      expect(results[1].displayText).toBe('♠Q');
      expect(results[2].displayText).toBe('♣10');
    });
  });

  describe('formatCardShort', () => {
    it('短縮表記を正しく生成する', () => {
      expect(formatCardShort('HEARTS', 'ACE')).toBe('♥A');
      expect(formatCardShort('SPADES', 'QUEEN')).toBe('♠Q');
    });
  });

  describe('formatCardShortFromInfo', () => {
    it('CardInfo型から短縮表記を生成する', () => {
      expect(formatCardShortFromInfo(mockCardInfo)).toBe('♥A');
      expect(formatCardShortFromInfo(mockSpadeQueen)).toBe('♠Q');
    });
  });

  describe('formatCardsCompact', () => {
    it('コンパクト表記を正しく生成する', () => {
      const cards = [
        { suit: 'HEARTS', rank: 'ACE' },
        { suit: 'SPADES', rank: 'QUEEN' }
      ];
      expect(formatCardsCompact(cards)).toBe('♥A ♠Q');
      expect(formatCardsCompact(cards, ', ')).toBe('♥A, ♠Q');
    });
  });

  describe('formatCardsCompactFromInfo', () => {
    it('CardInfo配列からコンパクト表記を生成する', () => {
      const cards = [mockCardInfo, mockSpadeQueen];
      expect(formatCardsCompactFromInfo(cards)).toBe('♥A ♠Q');
      expect(formatCardsCompactFromInfo(cards, ', ')).toBe('♥A, ♠Q');
    });
  });

  describe('getCardColorClass', () => {
    it('正しいCSSクラスを返す', () => {
      expect(getCardColorClass('red')).toBe('text-red-600');
      expect(getCardColorClass('black')).toBe('text-gray-900');
    });
  });

  describe('getCardPoints', () => {
    it('ハートカードで1点を返す', () => {
      expect(getCardPoints('HEARTS', 'ACE')).toBe(1);
      expect(getCardPoints('HEARTS', 'TWO')).toBe(1);
      expect(getCardPoints('HEARTS', 'KING')).toBe(1);
    });

    it('スペードのクイーンで13点を返す', () => {
      expect(getCardPoints('SPADES', 'QUEEN')).toBe(13);
    });

    it('その他のカードで0点を返す', () => {
      expect(getCardPoints('SPADES', 'ACE')).toBe(0);
      expect(getCardPoints('CLUBS', 'QUEEN')).toBe(0);
      expect(getCardPoints('DIAMONDS', 'KING')).toBe(0);
    });
  });

  describe('getCardSortOrder', () => {
    it('正しいソート順序を返す', () => {
      expect(getCardSortOrder('CLUBS', 'TWO')).toBe(2);
      expect(getCardSortOrder('DIAMONDS', 'ACE')).toBe(114);
      expect(getCardSortOrder('SPADES', 'QUEEN')).toBe(212);
      expect(getCardSortOrder('HEARTS', 'KING')).toBe(313);
    });

    it('スーツの順序が正しい（クラブ < ダイヤ < スペード < ハート）', () => {
      const clubsAce = getCardSortOrder('CLUBS', 'ACE');
      const diamondsAce = getCardSortOrder('DIAMONDS', 'ACE');
      const spadesAce = getCardSortOrder('SPADES', 'ACE');
      const heartsAce = getCardSortOrder('HEARTS', 'ACE');

      expect(clubsAce).toBeLessThan(diamondsAce);
      expect(diamondsAce).toBeLessThan(spadesAce);
      expect(spadesAce).toBeLessThan(heartsAce);
    });

    it('ランクの順序が正しい（2 < 3 < ... < K < A）', () => {
      const two = getCardSortOrder('HEARTS', 'TWO');
      const three = getCardSortOrder('HEARTS', 'THREE');
      const king = getCardSortOrder('HEARTS', 'KING');
      const ace = getCardSortOrder('HEARTS', 'ACE');

      expect(two).toBeLessThan(three);
      expect(king).toBeLessThan(ace);
    });
  });

  describe('色の判定', () => {
    it('赤色のスーツを正しく判定する', () => {
      expect(formatCard('HEARTS', 'ACE').color).toBe('red');
      expect(formatCard('DIAMONDS', 'KING').color).toBe('red');
    });

    it('黒色のスーツを正しく判定する', () => {
      expect(formatCard('SPADES', 'ACE').color).toBe('black');
      expect(formatCard('CLUBS', 'KING').color).toBe('black');
    });
  });

  describe('大文字小文字の処理', () => {
    it('小文字入力も正しく処理する', () => {
      const result = formatCard('hearts', 'ace');
      expect(result.displayText).toBe('♥A');
      expect(result.color).toBe('red');
    });
  });
});