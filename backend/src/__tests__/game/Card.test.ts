import { Card, Suit, Rank } from '../../game/Card';

describe('Card', () => {
  describe('constructor', () => {
    it('正しくカードを作成する', () => {
      const card = new Card(1, Suit.HEARTS, Rank.ACE);
      
      expect(card.id).toBe(1);
      expect(card.suit).toBe(Suit.HEARTS);
      expect(card.rank).toBe(Rank.ACE);
      expect(card.code).toBe('HACE');
      expect(card.pointValue).toBe(1);
      expect(card.sortOrder).toBe(314);
    });

    it('スペードのクイーンのポイント値が13になる', () => {
      const card = new Card(2, Suit.SPADES, Rank.QUEEN);
      
      expect(card.pointValue).toBe(13);
    });

    it('ハート以外でスペードのクイーン以外のポイント値が0になる', () => {
      const card = new Card(3, Suit.DIAMONDS, Rank.KING);
      
      expect(card.pointValue).toBe(0);
    });
  });

  describe('generateCode', () => {
    it('正しいコードを生成する', () => {
      const heartAce = new Card(1, Suit.HEARTS, Rank.ACE);
      const spadeQueen = new Card(2, Suit.SPADES, Rank.QUEEN);
      const clubTwo = new Card(3, Suit.CLUBS, Rank.TWO);
      const diamondKing = new Card(4, Suit.DIAMONDS, Rank.KING);

      expect(heartAce.code).toBe('HACE');
      expect(spadeQueen.code).toBe('SQUEEN');
      expect(clubTwo.code).toBe('CTWO');
      expect(diamondKing.code).toBe('DKING');
    });
  });

  describe('calculateSortOrder', () => {
    it('スート順序が正しい', () => {
      const clubsCard = new Card(1, Suit.CLUBS, Rank.TWO);
      const diamondsCard = new Card(2, Suit.DIAMONDS, Rank.TWO);
      const spadesCard = new Card(3, Suit.SPADES, Rank.TWO);
      const heartsCard = new Card(4, Suit.HEARTS, Rank.TWO);

      expect(clubsCard.sortOrder).toBeLessThan(diamondsCard.sortOrder);
      expect(diamondsCard.sortOrder).toBeLessThan(spadesCard.sortOrder);
      expect(spadesCard.sortOrder).toBeLessThan(heartsCard.sortOrder);
    });

    it('ランク順序が正しい', () => {
      const twoCard = new Card(1, Suit.HEARTS, Rank.TWO);
      const aceCard = new Card(2, Suit.HEARTS, Rank.ACE);

      expect(twoCard.sortOrder).toBeLessThan(aceCard.sortOrder);
    });
  });

  describe('isHearts', () => {
    it('ハートのカードでtrueを返す', () => {
      const card = new Card(1, Suit.HEARTS, Rank.ACE);
      expect(card.isHearts()).toBe(true);
    });

    it('ハート以外のカードでfalseを返す', () => {
      const card = new Card(1, Suit.SPADES, Rank.ACE);
      expect(card.isHearts()).toBe(false);
    });
  });

  describe('isQueenOfSpades', () => {
    it('スペードのクイーンでtrueを返す', () => {
      const card = new Card(1, Suit.SPADES, Rank.QUEEN);
      expect(card.isQueenOfSpades()).toBe(true);
    });

    it('スペードのクイーン以外でfalseを返す', () => {
      const card = new Card(1, Suit.HEARTS, Rank.QUEEN);
      expect(card.isQueenOfSpades()).toBe(false);
    });
  });

  describe('isTwoOfClubs', () => {
    it('クラブの2でtrueを返す', () => {
      const card = new Card(1, Suit.CLUBS, Rank.TWO);
      expect(card.isTwoOfClubs()).toBe(true);
    });

    it('クラブの2以外でfalseを返す', () => {
      const card = new Card(1, Suit.HEARTS, Rank.TWO);
      expect(card.isTwoOfClubs()).toBe(false);
    });
  });

  describe('hasPoints', () => {
    it('ポイントがあるカードでtrueを返す', () => {
      const heartCard = new Card(1, Suit.HEARTS, Rank.ACE);
      const queenOfSpades = new Card(2, Suit.SPADES, Rank.QUEEN);

      expect(heartCard.hasPoints()).toBe(true);
      expect(queenOfSpades.hasPoints()).toBe(true);
    });

    it('ポイントがないカードでfalseを返す', () => {
      const card = new Card(1, Suit.DIAMONDS, Rank.KING);
      expect(card.hasPoints()).toBe(false);
    });
  });

  describe('getRankValue', () => {
    it('正しいランク値を返す', () => {
      const twoCard = new Card(1, Suit.HEARTS, Rank.TWO);
      const aceCard = new Card(2, Suit.HEARTS, Rank.ACE);
      const kingCard = new Card(3, Suit.HEARTS, Rank.KING);

      expect(twoCard.getRankValue()).toBe(2);
      expect(aceCard.getRankValue()).toBe(14);
      expect(kingCard.getRankValue()).toBe(13);
    });
  });

  describe('toString', () => {
    it('正しい文字列表現を返す', () => {
      const card = new Card(1, Suit.HEARTS, Rank.ACE);
      expect(card.toString()).toBe('ACE of HEARTS');
    });
  });

  describe('equals', () => {
    it('同じIDのカードで同等性を判定する', () => {
      const card1 = new Card(1, Suit.HEARTS, Rank.ACE);
      const card2 = new Card(1, Suit.HEARTS, Rank.ACE);
      const card3 = new Card(2, Suit.HEARTS, Rank.ACE);

      expect(card1.equals(card2)).toBe(true);
      expect(card1.equals(card3)).toBe(false);
    });
  });
});