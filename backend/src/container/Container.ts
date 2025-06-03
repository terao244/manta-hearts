import { PlayerRepository } from '../repositories/PlayerRepository';
import { IPlayerRepository } from '../repositories/interfaces/IPlayerRepository';
import { GameRepository } from '../repositories/GameRepository';
import { IGameRepository } from '../repositories/interfaces/IGameRepository';

class Container {
  private static instance: Container;
  private playerRepository: IPlayerRepository | null = null;
  private gameRepository: IGameRepository | null = null;

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  getPlayerRepository(): IPlayerRepository {
    if (!this.playerRepository) {
      this.playerRepository = new PlayerRepository();
    }
    return this.playerRepository;
  }

  getGameRepository(): IGameRepository {
    if (!this.gameRepository) {
      this.gameRepository = new GameRepository();
    }
    return this.gameRepository;
  }

  // テスト用にPlayerRepositoryを注入する
  setPlayerRepository(repository: IPlayerRepository): void {
    this.playerRepository = repository;
  }

  // テスト用にGameRepositoryを注入する
  setGameRepository(repository: IGameRepository): void {
    this.gameRepository = repository;
  }

  // テスト後にリセット
  reset(): void {
    this.playerRepository = null;
    this.gameRepository = null;
  }
}

export default Container;