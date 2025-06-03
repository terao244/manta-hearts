import { GameData, GameDetailData, GameListQuery } from '../GameRepository';

export interface IGameRepository {
  findAll(query?: GameListQuery): Promise<{ games: GameData[]; total: number }>;
  findById(id: number): Promise<GameDetailData | null>;
  count(status?: 'PLAYING' | 'FINISHED' | 'PAUSED' | 'ABANDONED'): Promise<number>;
}