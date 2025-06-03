import { PlayerRepository } from '../repositories/PlayerRepository';
import { IPlayerRepository } from '../repositories/interfaces/IPlayerRepository';
import { GameRepository } from '../repositories/GameRepository';
import { IGameRepository } from '../repositories/interfaces/IGameRepository';
import { HandRepository } from '../repositories/HandRepository';
import { IHandRepository } from '../repositories/interfaces/IHandRepository';
import { HandCardRepository } from '../repositories/HandCardRepository';
import { IHandCardRepository } from '../repositories/interfaces/IHandCardRepository';

class Container {
  private static instance: Container;
  private playerRepository: IPlayerRepository | null = null;
  private gameRepository: IGameRepository | null = null;
  private handRepository: IHandRepository | null = null;
  private handCardRepository: IHandCardRepository | null = null;

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

  getHandRepository(): IHandRepository {
    if (!this.handRepository) {
      this.handRepository = new HandRepository();
    }
    return this.handRepository;
  }

  getHandCardRepository(): IHandCardRepository {
    if (!this.handCardRepository) {
      this.handCardRepository = new HandCardRepository();
    }
    return this.handCardRepository;
  }

  // テスト用にPlayerRepositoryを注入する
  setPlayerRepository(repository: IPlayerRepository): void {
    this.playerRepository = repository;
  }

  // テスト用にGameRepositoryを注入する
  setGameRepository(repository: IGameRepository): void {
    this.gameRepository = repository;
  }

  // テスト用にHandRepositoryを注入する
  setHandRepository(repository: IHandRepository): void {
    this.handRepository = repository;
  }

  // テスト用にHandCardRepositoryを注入する
  setHandCardRepository(repository: IHandCardRepository): void {
    this.handCardRepository = repository;
  }

  // テスト後にリセット
  reset(): void {
    this.playerRepository = null;
    this.gameRepository = null;
    this.handRepository = null;
    this.handCardRepository = null;
  }
}

export default Container;