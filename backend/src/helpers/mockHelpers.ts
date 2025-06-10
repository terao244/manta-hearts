import { IPlayerRepository } from '../repositories/interfaces/IPlayerRepository';
import { PlayerData } from '../repositories/PlayerRepository';
import { IGameRepository } from '../repositories/interfaces/IGameRepository';
import { GameData, GameDetailData, GameListQuery } from '../repositories/GameRepository';
import { IHandScoreRepository, HandScoreData } from '../repositories/interfaces/IHandScoreRepository';
import { GameStatus, HandScore } from '@prisma/client';

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

export class MockHandScoreRepository implements IHandScoreRepository {
  saveHandScores = jest.fn<Promise<HandScore[]>, [number, HandScoreData[]]>();
  findByHandId = jest.fn<Promise<HandScore[]>, [number]>();
  findByPlayerId = jest.fn<Promise<HandScore[]>, [number]>();
  findByHandIdAndPlayerId = jest.fn<Promise<HandScore | null>, [number, number]>();
}

export const createMockHandScoreRepository = (): MockHandScoreRepository => {
  return new MockHandScoreRepository();
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

  const mockHandScoreMethods = {
    createMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  };

  const mockGameMethods = {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  };

  // トランザクション内で使用されるtxオブジェクトのモック
  const mockTransactionClient = {
    hand: mockHandMethods,
    handCard: mockHandCardMethods,
    cardExchange: mockCardExchangeMethods,
    trick: mockTrickMethods,
    trickCard: mockTrickCardMethods,
    handScore: mockHandScoreMethods,
    game: mockGameMethods
  };

  // $transactionメソッドのモック
  const mockTransaction = jest.fn().mockImplementation(async (callback) => {
    return await callback(mockTransactionClient);
  });

  const mockPrismaClient = {
    hand: mockHandMethods,
    handCard: mockHandCardMethods,
    cardExchange: mockCardExchangeMethods,
    trick: mockTrickMethods,
    trickCard: mockTrickCardMethods,
    handScore: mockHandScoreMethods,
    game: mockGameMethods,
    $transaction: mockTransaction
  };

  return {
    client: mockPrismaClient,
    getClient: jest.fn().mockReturnValue(mockPrismaClient),
    mockTransaction // テストでトランザクション動作をカスタマイズ可能
  };
};