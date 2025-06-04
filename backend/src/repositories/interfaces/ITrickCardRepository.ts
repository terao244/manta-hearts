import { TrickCard } from '@prisma/client';

export interface TrickCardData {
  playerId: number;
  cardId: number;
  playOrder: number;
}

export interface ITrickCardRepository {
  saveTrickCard(trickId: number, trickCardData: TrickCardData): Promise<TrickCard>;
  
  saveTrickCards(trickId: number, trickCards: TrickCardData[]): Promise<TrickCard[]>;
  
  findByTrickId(trickId: number): Promise<TrickCard[]>;
  
  findByTrickIdAndPlayer(trickId: number, playerId: number): Promise<TrickCard | null>;
}