import { Prisma } from '@prisma/client';
import { HandCardWithRelations, HandCardWithCard } from '../HandCardRepository';

export interface IHandCardRepository {
  saveHandCards(handId: number, playerCards: Map<number, number[]>): Promise<Prisma.BatchPayload>;

  findByHandId(handId: number): Promise<HandCardWithRelations[]>;

  findByHandIdAndPlayerId(handId: number, playerId: number): Promise<HandCardWithCard[]>;

  getCardCountByPlayer(handId: number): Promise<Map<number, number>>;

  getTotalCardCount(handId: number): Promise<number>;
}