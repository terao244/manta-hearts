import { PlayerRepository } from '../repositories/PlayerRepository';
import { IPlayerRepository } from '../repositories/interfaces/IPlayerRepository';

class Container {
  private static instance: Container;
  private playerRepository: IPlayerRepository | null = null;

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

  // テスト用にPlayerRepositoryを注入する
  setPlayerRepository(repository: IPlayerRepository): void {
    this.playerRepository = repository;
  }

  // テスト後にリセット
  reset(): void {
    this.playerRepository = null;
  }
}

export default Container;