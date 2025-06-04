import { Trick } from '@prisma/client';

export interface TrickData {
  trickNumber: number;
  winnerPlayerId: number;
  points: number;
  leadPlayerId: number;
}

export interface ITrickRepository {
  createTrick(handId: number, trickData: TrickData): Promise<Trick>;
  
  findByHandId(handId: number): Promise<Trick[]>;
  
  findByHandIdAndTrickNumber(handId: number, trickNumber: number): Promise<Trick | null>;
  
  updateTrick(trickId: number, updates: Partial<TrickData>): Promise<Trick>;
}