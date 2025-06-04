import { CardExchange } from '@prisma/client';

export interface CardExchangeData {
  fromPlayerId: number;
  toPlayerId: number;
  cardId: number;
  exchangeOrder: number;
}

export interface ICardExchangeRepository {
  saveCardExchanges(handId: number, exchanges: CardExchangeData[]): Promise<CardExchange[]>;
  
  findByHandId(handId: number): Promise<CardExchange[]>;
  
  findByHandIdAndPlayer(handId: number, playerId: number): Promise<CardExchange[]>;
}