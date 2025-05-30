export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS', 
  CLUBS = 'CLUBS',
  SPADES = 'SPADES'
}

export enum Rank {
  ACE = 'ACE',
  TWO = 'TWO', 
  THREE = 'THREE',
  FOUR = 'FOUR',
  FIVE = 'FIVE',
  SIX = 'SIX',
  SEVEN = 'SEVEN',
  EIGHT = 'EIGHT',
  NINE = 'NINE',
  TEN = 'TEN',
  JACK = 'JACK',
  QUEEN = 'QUEEN',
  KING = 'KING'
}

export class Card {
  public readonly id: number;
  public readonly suit: Suit;
  public readonly rank: Rank;
  public readonly code: string;
  public readonly pointValue: number;
  public readonly sortOrder: number;

  constructor(id: number, suit: Suit, rank: Rank) {
    this.id = id;
    this.suit = suit;
    this.rank = rank;
    this.code = this.generateCode();
    this.pointValue = this.calculatePointValue();
    this.sortOrder = this.calculateSortOrder();
  }

  private generateCode(): string {
    const suitCode = this.suit.charAt(0);
    return `${suitCode}${this.rank}`;
  }

  private calculatePointValue(): number {
    if (this.suit === Suit.HEARTS) {
      return 1;
    }
    if (this.suit === Suit.SPADES && this.rank === Rank.QUEEN) {
      return 13;
    }
    return 0;
  }

  private calculateSortOrder(): number {
    const suitOrder = {
      [Suit.CLUBS]: 0,
      [Suit.DIAMONDS]: 1,
      [Suit.SPADES]: 2,
      [Suit.HEARTS]: 3
    };

    const rankOrder = {
      [Rank.TWO]: 2,
      [Rank.THREE]: 3,
      [Rank.FOUR]: 4,
      [Rank.FIVE]: 5,
      [Rank.SIX]: 6,
      [Rank.SEVEN]: 7,
      [Rank.EIGHT]: 8,
      [Rank.NINE]: 9,
      [Rank.TEN]: 10,
      [Rank.JACK]: 11,
      [Rank.QUEEN]: 12,
      [Rank.KING]: 13,
      [Rank.ACE]: 14
    };

    return suitOrder[this.suit] * 100 + rankOrder[this.rank];
  }

  public isHearts(): boolean {
    return this.suit === Suit.HEARTS;
  }

  public isQueenOfSpades(): boolean {
    return this.suit === Suit.SPADES && this.rank === Rank.QUEEN;
  }

  public isTwoOfClubs(): boolean {
    return this.suit === Suit.CLUBS && this.rank === Rank.TWO;
  }

  public hasPoints(): boolean {
    return this.pointValue > 0;
  }

  public getRankValue(): number {
    const rankValues = {
      [Rank.TWO]: 2,
      [Rank.THREE]: 3,
      [Rank.FOUR]: 4,
      [Rank.FIVE]: 5,
      [Rank.SIX]: 6,
      [Rank.SEVEN]: 7,
      [Rank.EIGHT]: 8,
      [Rank.NINE]: 9,
      [Rank.TEN]: 10,
      [Rank.JACK]: 11,
      [Rank.QUEEN]: 12,
      [Rank.KING]: 13,
      [Rank.ACE]: 14
    };
    return rankValues[this.rank];
  }

  public toString(): string {
    return `${this.rank} of ${this.suit}`;
  }

  public equals(other: Card): boolean {
    return this.id === other.id;
  }
}