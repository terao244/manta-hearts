import { HandScore } from '@prisma/client';

export interface HandScoreData {
  playerId: number;
  handPoints: number;
  cumulativePoints: number;
  heartsTaken: number;
  queenOfSpadesTaken: boolean;
  shootTheMoonAchieved: boolean;
}

export interface IHandScoreRepository {
  saveHandScores(handId: number, handScores: HandScoreData[]): Promise<HandScore[]>;
  
  findByHandId(handId: number): Promise<HandScore[]>;
  
  findByPlayerId(playerId: number): Promise<HandScore[]>;
  
  findByHandIdAndPlayerId(handId: number, playerId: number): Promise<HandScore | null>;
}