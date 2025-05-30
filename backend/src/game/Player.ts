import { Card } from './Card';

export interface Player {
  id: number;
  name: string;
  displayName: string;
  position: PlayerPosition;
  hand: Card[];
  score: number;
  cumulativeScore: number;
  isConnected: boolean;
  lastActiveAt: Date;
}

export enum PlayerPosition {
  NORTH = 'North',
  EAST = 'East', 
  SOUTH = 'South',
  WEST = 'West'
}

export interface GamePlayer extends Player {
  exchangeCards?: Card[];
  hasExchanged: boolean;
  hasPlayedInTrick: boolean;
}

export class PlayerManager {
  private players: Map<number, GamePlayer>;
  private positions: Map<PlayerPosition, number>;

  constructor() {
    this.players = new Map();
    this.positions = new Map();
  }

  public addPlayer(player: Player): GamePlayer {
    const gamePlayer: GamePlayer = {
      ...player,
      hand: [],
      exchangeCards: undefined,
      hasExchanged: false,
      hasPlayedInTrick: false
    };

    this.players.set(player.id, gamePlayer);
    this.positions.set(player.position, player.id);
    
    return gamePlayer;
  }

  public getPlayer(playerId: number): GamePlayer | undefined {
    return this.players.get(playerId);
  }

  public getAllPlayers(): GamePlayer[] {
    return Array.from(this.players.values());
  }

  public getPlayerByPosition(position: PlayerPosition): GamePlayer | undefined {
    const playerId = this.positions.get(position);
    return playerId ? this.players.get(playerId) : undefined;
  }

  public dealCards(playerId: number, cards: Card[]): void {
    const player = this.players.get(playerId);
    if (player) {
      player.hand = cards;
      this.sortPlayerHand(playerId);
    }
  }

  public playCard(playerId: number, cardId: number): Card | null {
    const player = this.players.get(playerId);
    if (!player) return null;

    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return null;

    const playedCard = player.hand.splice(cardIndex, 1)[0];
    player.hasPlayedInTrick = true;
    
    return playedCard;
  }

  public addCardToHand(playerId: number, card: Card): void {
    const player = this.players.get(playerId);
    if (player) {
      player.hand.push(card);
      this.sortPlayerHand(playerId);
    }
  }

  public removeCardsFromHand(playerId: number, cardIds: number[]): Card[] {
    const player = this.players.get(playerId);
    if (!player) return [];

    const removedCards: Card[] = [];
    
    cardIds.forEach(cardId => {
      const cardIndex = player.hand.findIndex(card => card.id === cardId);
      if (cardIndex !== -1) {
        removedCards.push(player.hand.splice(cardIndex, 1)[0]);
      }
    });

    return removedCards;
  }

  public setExchangeCards(playerId: number, cardIds: number[]): boolean {
    const player = this.players.get(playerId);
    if (!player || cardIds.length !== 3) return false;

    const exchangeCards = this.removeCardsFromHand(playerId, cardIds);
    if (exchangeCards.length !== 3) {
      // カードを手札に戻す
      exchangeCards.forEach(card => this.addCardToHand(playerId, card));
      return false;
    }

    player.exchangeCards = exchangeCards;
    player.hasExchanged = true;
    
    return true;
  }

  public getExchangeCards(playerId: number): Card[] | undefined {
    const player = this.players.get(playerId);
    return player?.exchangeCards;
  }

  public clearExchangeCards(playerId: number): void {
    const player = this.players.get(playerId);
    if (player) {
      player.exchangeCards = undefined;
      player.hasExchanged = false;
    }
  }

  public updateScore(playerId: number, handScore: number): void {
    const player = this.players.get(playerId);
    if (player) {
      player.score = handScore;
      player.cumulativeScore += handScore;
    }
  }

  public resetTrickFlags(): void {
    this.players.forEach(player => {
      player.hasPlayedInTrick = false;
    });
  }

  public resetForNewHand(): void {
    this.players.forEach(player => {
      player.hand = [];
      player.exchangeCards = undefined;
      player.hasExchanged = false;
      player.hasPlayedInTrick = false;
      player.score = 0;
    });
  }

  public hasCard(playerId: number, cardId: number): boolean {
    const player = this.players.get(playerId);
    return player ? player.hand.some(card => card.id === cardId) : false;
  }

  public getPlayerHandSize(playerId: number): number {
    const player = this.players.get(playerId);
    return player ? player.hand.length : 0;
  }

  public getAllConnectedPlayers(): GamePlayer[] {
    return Array.from(this.players.values()).filter(player => player.isConnected);
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public allPlayersExchanged(): boolean {
    return Array.from(this.players.values()).every(player => player.hasExchanged);
  }

  public allPlayersPlayedInTrick(): boolean {
    return Array.from(this.players.values()).every(player => player.hasPlayedInTrick);
  }

  private sortPlayerHand(playerId: number): void {
    const player = this.players.get(playerId);
    if (player) {
      player.hand.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  public static getPositions(): PlayerPosition[] {
    return [PlayerPosition.NORTH, PlayerPosition.EAST, PlayerPosition.SOUTH, PlayerPosition.WEST];
  }

  public static getNextPosition(position: PlayerPosition): PlayerPosition {
    const positions = PlayerManager.getPositions();
    const currentIndex = positions.indexOf(position);
    return positions[(currentIndex + 1) % positions.length];
  }

  public static getPositionById(positionIndex: number): PlayerPosition {
    const positions = PlayerManager.getPositions();
    return positions[positionIndex % positions.length];
  }
}