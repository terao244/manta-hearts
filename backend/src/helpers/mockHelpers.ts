import { IPlayerRepository } from '../repositories/interfaces/IPlayerRepository';
import { PlayerData } from '../repositories/PlayerRepository';
import { IGameRepository } from '../repositories/interfaces/IGameRepository';
import { GameData, GameDetailData, GameListQuery } from '../repositories/GameRepository';
import { GameStatus } from '@prisma/client';

export class MockPlayerRepository implements IPlayerRepository {
  findAll = jest.fn<Promise<PlayerData[]>, [boolean?]>();
  findById = jest.fn<Promise<PlayerData | null>, [number]>();
  findByName = jest.fn<Promise<PlayerData | null>, [string]>();
  create = jest.fn<Promise<PlayerData>, [Omit<PlayerData, 'id'>]>();
  update = jest.fn<Promise<PlayerData | null>, [number, Partial<Omit<PlayerData, 'id'>>]>();
  delete = jest.fn<Promise<boolean>, [number]>();
  count = jest.fn<Promise<number>, [boolean?]>();
}

export const createMockPlayerRepository = (): MockPlayerRepository => {
  return new MockPlayerRepository();
};

export class MockGameRepository implements IGameRepository {
  findAll = jest.fn<Promise<{ games: GameData[]; total: number }>, [GameListQuery?]>();
  findById = jest.fn<Promise<GameDetailData | null>, [number]>();
  count = jest.fn<Promise<number>, [GameStatus?]>();
}

export const createMockGameRepository = (): MockGameRepository => {
  return new MockGameRepository();
};

export const createMockPrismaService = () => {
  const mockHandMethods = {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  };

  const mockHandCardMethods = {
    createMany: jest.fn(),
    findMany: jest.fn()
  };

  const mockCardExchangeMethods = {
    createMany: jest.fn(),
    findMany: jest.fn()
  };

  const mockTrickMethods = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  };

  const mockTrickCardMethods = {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn()
  };

  return {
    client: {
      hand: mockHandMethods,
      handCard: mockHandCardMethods,
      cardExchange: mockCardExchangeMethods,
      trick: mockTrickMethods,
      trickCard: mockTrickCardMethods
    },
    getClient: jest.fn().mockReturnValue({
      hand: mockHandMethods,
      handCard: mockHandCardMethods,
      cardExchange: mockCardExchangeMethods,
      trick: mockTrickMethods,
      trickCard: mockTrickCardMethods
    })
  };
};