import { PlayerRepository } from '../repositories/PlayerRepository';
import { IPlayerRepository } from '../repositories/interfaces/IPlayerRepository';
import { GameRepository } from '../repositories/GameRepository';
import { IGameRepository } from '../repositories/interfaces/IGameRepository';
import { HandRepository } from '../repositories/HandRepository';
import { IHandRepository } from '../repositories/interfaces/IHandRepository';
import { HandCardRepository } from '../repositories/HandCardRepository';
import { IHandCardRepository } from '../repositories/interfaces/IHandCardRepository';
import { CardExchangeRepository } from '../repositories/CardExchangeRepository';
import { ICardExchangeRepository } from '../repositories/interfaces/ICardExchangeRepository';
import { TrickRepository } from '../repositories/TrickRepository';
import { ITrickRepository } from '../repositories/interfaces/ITrickRepository';
import { TrickCardRepository } from '../repositories/TrickCardRepository';
import { ITrickCardRepository } from '../repositories/interfaces/ITrickCardRepository';
import { HandScoreRepository } from '../repositories/HandScoreRepository';
import { IHandScoreRepository } from '../repositories/interfaces/IHandScoreRepository';

class Container {
  private static instance: Container;
  private playerRepository: IPlayerRepository | null = null;
  private gameRepository: IGameRepository | null = null;
  private handRepository: IHandRepository | null = null;
  private handCardRepository: IHandCardRepository | null = null;
  private cardExchangeRepository: ICardExchangeRepository | null = null;
  private trickRepository: ITrickRepository | null = null;
  private trickCardRepository: ITrickCardRepository | null = null;
  private handScoreRepository: IHandScoreRepository | null = null;

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

  getCardExchangeRepository(): ICardExchangeRepository {
    if (!this.cardExchangeRepository) {
      this.cardExchangeRepository = new CardExchangeRepository();
    }
    return this.cardExchangeRepository;
  }

  getTrickRepository(): ITrickRepository {
    if (!this.trickRepository) {
      this.trickRepository = new TrickRepository();
    }
    return this.trickRepository;
  }

  getTrickCardRepository(): ITrickCardRepository {
    if (!this.trickCardRepository) {
      this.trickCardRepository = new TrickCardRepository();
    }
    return this.trickCardRepository;
  }

  getHandScoreRepository(): IHandScoreRepository {
    if (!this.handScoreRepository) {
      this.handScoreRepository = new HandScoreRepository();
    }
    return this.handScoreRepository;
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

  // テスト用にCardExchangeRepositoryを注入する
  setCardExchangeRepository(repository: ICardExchangeRepository): void {
    this.cardExchangeRepository = repository;
  }

  // テスト用にTrickRepositoryを注入する
  setTrickRepository(repository: ITrickRepository): void {
    this.trickRepository = repository;
  }

  // テスト用にTrickCardRepositoryを注入する
  setTrickCardRepository(repository: ITrickCardRepository): void {
    this.trickCardRepository = repository;
  }

  // テスト用にHandScoreRepositoryを注入する
  setHandScoreRepository(repository: IHandScoreRepository): void {
    this.handScoreRepository = repository;
  }

  // テスト後にリセット
  reset(): void {
    this.playerRepository = null;
    this.gameRepository = null;
    this.handRepository = null;
    this.handCardRepository = null;
    this.cardExchangeRepository = null;
    this.trickRepository = null;
    this.trickCardRepository = null;
    this.handScoreRepository = null;
  }
}

export default Container;