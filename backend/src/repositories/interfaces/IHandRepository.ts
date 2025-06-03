import { Hand } from '@prisma/client';
import { HandUpdateData } from '../HandRepository';

export interface IHandRepository {
  createHand(
    gameId: number, 
    handNumber: number, 
    heartsBroken?: boolean, 
    shootTheMoonPlayerId?: number | null
  ): Promise<Hand>;

  updateHand(handId: number, updates: HandUpdateData): Promise<Hand>;

  findByGameId(gameId: number): Promise<Hand[]>;

  findById(handId: number): Promise<Hand | null>;

  findByGameIdAndHandNumber(gameId: number, handNumber: number): Promise<Hand | null>;
}