import { Card, Suit, Rank } from './Card';
import { Deck } from './Deck';
import { GameState, GamePhase, GameStatus, ExchangeDirection } from './GameState';
import { GamePlayer, PlayerPosition, PlayerManager } from './Player';

export interface GameEngineEvents {
  onGameStateChanged: (gameState: GameState) => void;
  onPlayerJoined: (playerId: number) => void;
  onPlayerLeft: (playerId: number) => void;
  onHandStarted: (handNumber: number) => void;
  onCardsDealt: (playerHands: Map<number, Card[]>) => void;
  onExchangePhaseStarted: (direction: ExchangeDirection) => void;
  onPlayingPhaseStarted: (leadPlayerId: number) => void;
  onCardPlayed: (playerId: number, card: Card) => void;
  onTrickCompleted: (trickNumber: number, winnerId: number, points: number) => void;
  onHandCompleted: (handNumber: number, scores: Map<number, number>) => void;
  onGameCompleted: (winnerId: number, finalScores: Map<number, number>) => void;
  onError: (error: Error) => void;
}

export class GameEngine {
  private gameState: GameState;
  private playerManager: PlayerManager;
  private deck: Deck;
  private eventListeners: Partial<GameEngineEvents>;

  constructor(gameId: number, eventListeners: Partial<GameEngineEvents> = {}) {
    this.gameState = new GameState(gameId);
    this.playerManager = new PlayerManager();
    this.deck = new Deck();
    this.eventListeners = eventListeners;
  }

  public addPlayer(player: Omit<GamePlayer, 'hand' | 'exchangeCards' | 'hasExchanged' | 'hasPlayedInTrick'>): boolean {
    try {
      if (this.gameState.isFull()) {
        return false;
      }

      const gamePlayer = this.playerManager.addPlayer(player as any);
      const success = this.gameState.addPlayer(gamePlayer);
      
      if (success) {
        this.eventListeners.onPlayerJoined?.(player.id);
        this.eventListeners.onGameStateChanged?.(this.gameState);
      }

      return success;
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
      return false;
    }
  }

  public removePlayer(playerId: number): boolean {
    try {
      const player = this.gameState.getPlayer(playerId);
      if (!player) return false;

      // ゲーム中の場合は一時停止
      if (this.gameState.phase !== GamePhase.WAITING) {
        this.gameState.status = GameStatus.PAUSED;
      }

      this.eventListeners.onPlayerLeft?.(playerId);
      this.eventListeners.onGameStateChanged?.(this.gameState);
      
      return true;
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
      return false;
    }
  }

  public startGame(): boolean {
    try {
      if (!this.gameState.isGameReady()) {
        return false;
      }

      this.startNewHand();
      return true;
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
      return false;
    }
  }

  public startNewHand(): void {
    try {
      this.gameState.startNewHand();
      this.eventListeners.onHandStarted?.(this.gameState.currentHand);

      // カードを配る
      this.dealCards();
      
      // 交換フェーズまたはプレイフェーズを開始
      if (this.gameState.exchangeDirection === ExchangeDirection.NONE) {
        this.startPlayingPhase();
      } else {
        this.startExchangePhase();
      }

      this.eventListeners.onGameStateChanged?.(this.gameState);
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
    }
  }

  public dealCards(): void {
    try {
      this.deck.reset();
      this.deck.shuffle();
      
      const playerHands = this.deck.dealToPlayers(4, 13);
      const playerIds = Array.from(this.gameState.players.keys());
      const playerHandsMap = new Map<number, Card[]>();

      playerIds.forEach((playerId, index) => {
        const hand = playerHands[index];
        this.playerManager.dealCards(playerId, hand);
        playerHandsMap.set(playerId, hand);
      });

      this.eventListeners.onCardsDealt?.(playerHandsMap);
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
    }
  }

  public startExchangePhase(): void {
    try {
      this.gameState.startExchangePhase();
      this.eventListeners.onExchangePhaseStarted?.(this.gameState.exchangeDirection);
      this.eventListeners.onGameStateChanged?.(this.gameState);
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
    }
  }

  public exchangeCards(playerId: number, cardIds: number[]): boolean {
    try {
      if (this.gameState.phase !== GamePhase.EXCHANGING) {
        return false;
      }

      const success = this.playerManager.setExchangeCards(playerId, cardIds);
      if (!success) return false;

      // 全プレイヤーが交換完了した場合、カード配布を実行
      if (this.playerManager.allPlayersExchanged()) {
        this.performCardExchange();
        this.startPlayingPhase();
      }

      this.eventListeners.onGameStateChanged?.(this.gameState);
      return true;
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
      return false;
    }
  }

  private performCardExchange(): void {
    const playerIds = Array.from(this.gameState.players.keys());
    const exchangeMap = new Map<number, Card[]>();

    // 各プレイヤーの交換カードを取得
    playerIds.forEach(playerId => {
      const exchangeCards = this.playerManager.getExchangeCards(playerId);
      if (exchangeCards) {
        exchangeMap.set(playerId, exchangeCards);
      }
    });

    // 交換方向に従ってカードを配布
    playerIds.forEach(playerId => {
      const targetPlayerId = this.getExchangeTargetPlayer(playerId);
      const cardsToReceive = exchangeMap.get(targetPlayerId);
      
      if (cardsToReceive) {
        cardsToReceive.forEach(card => {
          this.playerManager.addCardToHand(playerId, card);
        });
      }
    });

    // 交換カードをクリア
    playerIds.forEach(playerId => {
      this.playerManager.clearExchangeCards(playerId);
    });
  }

  private getExchangeTargetPlayer(playerId: number): number {
    const players = this.gameState.getAllPlayers();
    const currentIndex = players.findIndex(p => p.id === playerId);
    
    let targetIndex: number;
    
    switch (this.gameState.exchangeDirection) {
      case ExchangeDirection.LEFT:
        targetIndex = (currentIndex + 1) % 4;
        break;
      case ExchangeDirection.RIGHT:
        targetIndex = (currentIndex + 3) % 4;
        break;
      case ExchangeDirection.ACROSS:
        targetIndex = (currentIndex + 2) % 4;
        break;
      default:
        return playerId;
    }

    return players[targetIndex].id;
  }

  public startPlayingPhase(): void {
    try {
      this.gameState.startPlayingPhase();
      
      // クラブの2を持っているプレイヤーを見つけてリードプレイヤーに設定
      const leadPlayerId = this.findPlayerWithTwoOfClubs();
      
      this.gameState.startNewTrick(leadPlayerId);
      this.eventListeners.onPlayingPhaseStarted?.(leadPlayerId);
      this.eventListeners.onGameStateChanged?.(this.gameState);
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
    }
  }

  private findPlayerWithTwoOfClubs(): number {
    const twoOfClubs = this.deck.findCard(Suit.CLUBS, Rank.TWO);
    if (!twoOfClubs) {
      // フォールバック: 最初のプレイヤー
      return this.gameState.getAllPlayers()[0].id;
    }

    for (const player of this.gameState.getAllPlayers()) {
      if (this.playerManager.hasCard(player.id, twoOfClubs.id)) {
        return player.id;
      }
    }

    // フォールバック: 最初のプレイヤー
    return this.gameState.getAllPlayers()[0].id;
  }

  public playCard(playerId: number, cardId: number): boolean {
    try {
      if (this.gameState.phase !== GamePhase.PLAYING) {
        return false;
      }

      const card = this.deck.getCardById(cardId);
      if (!card) return false;

      if (!this.gameState.canPlayCard(playerId, card)) {
        return false;
      }

      // カードをプレイ
      const playedCard = this.playerManager.playCard(playerId, cardId);
      if (!playedCard) return false;

      this.gameState.addCardToCurrentTrick(playerId, playedCard);
      this.eventListeners.onCardPlayed?.(playerId, playedCard);

      // トリック完了チェック
      const currentTrick = this.gameState.getCurrentTrick();
      if (currentTrick && currentTrick.cards.length === 4) {
        this.completeTrick();
      } else {
        // 次のプレイヤーのターン
        const nextPlayer = this.gameState.getNextPlayer(playerId);
        this.gameState.currentTurn = nextPlayer || undefined;
      }

      this.eventListeners.onGameStateChanged?.(this.gameState);
      return true;
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
      return false;
    }
  }

  private completeTrick(): void {
    try {
      const completedTrick = this.gameState.completeCurrentTrick();
      if (!completedTrick) return;

      this.playerManager.resetTrickFlags();
      
      this.eventListeners.onTrickCompleted?.(
        completedTrick.trickNumber,
        completedTrick.winnerId!,
        completedTrick.points
      );

      // ハンド完了チェック
      if (this.gameState.currentTrick >= 13) {
        this.completeHand();
      } else {
        // 次のトリック開始
        this.gameState.startNewTrick(completedTrick.winnerId!);
      }
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
    }
  }

  private completeHand(): void {
    try {
      const handResult = this.gameState.completeHand();
      
      // プレイヤーマネージャーのスコアも更新
      handResult.playerScores.forEach((score, playerId) => {
        this.playerManager.updateScore(playerId, score);
      });

      this.eventListeners.onHandCompleted?.(handResult.handNumber, handResult.playerScores);

      // ゲーム終了チェック
      if (this.gameState.isGameCompleted()) {
        this.completeGame();
      } else {
        this.playerManager.resetForNewHand();
        this.startNewHand();
      }
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
    }
  }

  private completeGame(): void {
    try {
      this.gameState.phase = GamePhase.COMPLETED;
      this.gameState.status = GameStatus.FINISHED;
      this.gameState.completedAt = new Date();

      const winnerId = this.gameState.getWinnerId();
      if (winnerId) {
        this.eventListeners.onGameCompleted?.(winnerId, this.gameState.cumulativeScores);
      }

      this.eventListeners.onGameStateChanged?.(this.gameState);
    } catch (error) {
      this.eventListeners.onError?.(error as Error);
    }
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public getPlayerHand(playerId: number): Card[] {
    const player = this.playerManager.getPlayer(playerId);
    return player ? [...player.hand] : [];
  }

  public isValidMove(playerId: number, cardId: number): boolean {
    const card = this.deck.getCardById(cardId);
    return card ? this.gameState.canPlayCard(playerId, card) : false;
  }

  public getCurrentTurn(): number | undefined {
    return this.gameState.currentTurn;
  }

  public getScore(playerId: number): number {
    return this.gameState.cumulativeScores.get(playerId) || 0;
  }
}