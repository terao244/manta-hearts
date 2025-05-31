import { PlayerData } from '../PlayerRepository';

export interface IPlayerRepository {
  findAll(activeOnly?: boolean): Promise<PlayerData[]>;
  findById(id: number): Promise<PlayerData | null>;
  findByName(name: string): Promise<PlayerData | null>;
  create(data: Omit<PlayerData, 'id'>): Promise<PlayerData>;
  update(id: number, data: Partial<Omit<PlayerData, 'id'>>): Promise<PlayerData | null>;
  delete(id: number): Promise<boolean>;
  count(activeOnly?: boolean): Promise<number>;
}