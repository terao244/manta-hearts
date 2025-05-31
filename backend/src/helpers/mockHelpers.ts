import { IPlayerRepository } from '../repositories/interfaces/IPlayerRepository';
import { PlayerData } from '../repositories/PlayerRepository';

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