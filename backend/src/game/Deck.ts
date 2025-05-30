import { Card, Suit, Rank } from './Card';

export class Deck {
  private cards: Card[];
  private originalCards: Card[];

  constructor() {
    this.cards = [];
    this.originalCards = [];
    this.initializeDeck();
  }

  private initializeDeck(): void {
    let cardId = 1;
    
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        const card = new Card(cardId, suit, rank);
        this.cards.push(card);
        this.originalCards.push(card);
        cardId++;
      }
    }
  }

  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public deal(numberOfCards: number): Card[] {
    if (numberOfCards > this.cards.length) {
      throw new Error(`Cannot deal ${numberOfCards} cards, only ${this.cards.length} remaining`);
    }

    return this.cards.splice(0, numberOfCards);
  }

  public dealToPlayers(numberOfPlayers: number, cardsPerPlayer: number): Card[][] {
    const totalCardsNeeded = numberOfPlayers * cardsPerPlayer;
    
    if (totalCardsNeeded > this.cards.length) {
      throw new Error(`Cannot deal ${totalCardsNeeded} cards to ${numberOfPlayers} players, only ${this.cards.length} remaining`);
    }

    const hands: Card[][] = [];
    
    for (let i = 0; i < numberOfPlayers; i++) {
      hands.push([]);
    }

    for (let cardIndex = 0; cardIndex < totalCardsNeeded; cardIndex++) {
      const playerIndex = cardIndex % numberOfPlayers;
      hands[playerIndex].push(this.cards.shift()!);
    }

    return hands;
  }

  public reset(): void {
    this.cards = [...this.originalCards];
  }

  public getCards(): Card[] {
    return [...this.cards];
  }

  public getRemainingCount(): number {
    return this.cards.length;
  }

  public isEmpty(): boolean {
    return this.cards.length === 0;
  }

  public getCardById(cardId: number): Card | undefined {
    return this.originalCards.find(card => card.id === cardId);
  }

  public static getStandardDeckSize(): number {
    return 52;
  }

  public findCard(suit: Suit, rank: Rank): Card | undefined {
    return this.originalCards.find(card => 
      card.suit === suit && card.rank === rank
    );
  }

  public getAllCards(): Card[] {
    return [...this.originalCards];
  }
}