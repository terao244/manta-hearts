import { Card } from './Card';
import { GamePlayer, PlayerPosition } from './Player';
import { getGameConfig } from '../config/gameConfig';

export enum GamePhase {
  WAITING = 'waiting',
  DEALING = 'dealing', 
  EXCHANGING = 'exchanging',
  PLAYING = 'playing',
  COMPLETED = 'completed'
}

export enum GameStatus {
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
  PAUSED = 'PAUSED',
  ABANDONED = 'ABANDONED'
}

export enum ExchangeDirection {
  LEFT = 'left',
  RIGHT = 'right', 
  ACROSS = 'across',
  NONE = 'none'
}

export interface Trick {
  trickNumber: number;
  cards: PlayedCard[];
  leadPlayerId: number;
  winnerId?: number;
  points: number;
  isCompleted: boolean;
}

export interface PlayedCard {
  playerId: number;
  card: Card;
  playOrder: number;
}

export interface HandResult {
  handNumber: number;
  playerScores: Map<number, number>;
  shootTheMoonPlayerId?: number;
  tricks: Trick[];
}

export class GameState {
  public readonly gameId: number;
  public status: GameStatus;
  public phase: GamePhase;
  public players: Map<number, GamePlayer>;
  public currentHand: number;
  public currentTrick: number;
  public currentTurn?: number;
  public heartsBroken: boolean;
  public tricks: Trick[];
  public handResults: HandResult[];
  public cumulativeScores: Map<number, number>;
  public exchangeDirection: ExchangeDirection;
  public startedAt: Date;
  public completedAt?: Date;

  constructor(gameId: number) {
    this.gameId = gameId;
    this.status = GameStatus.PLAYING;
    this.phase = GamePhase.WAITING;
    this.players = new Map();
    this.currentHand = 0;
    this.currentTrick = 0;
    this.currentTurn = undefined;
    this.heartsBroken = false;
    this.tricks = [];
    this.handResults = [];
    this.cumulativeScores = new Map();
    this.exchangeDirection = ExchangeDirection.LEFT;
    this.startedAt = new Date();
  }

  public addPlayer(player: GamePlayer): boolean {
    if (this.players.size >= 4) return false;
    
    this.players.set(player.id, player);
    this.cumulativeScores.set(player.id, 0);
    
    return true;
  }

  public getPlayer(playerId: number): GamePlayer | undefined {
    return this.players.get(playerId);
  }

  public getAllPlayers(): GamePlayer[] {
    return Array.from(this.players.values());
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public isFull(): boolean {
    return this.players.size === 4;
  }

  public isGameReady(): boolean {
    return this.isFull() && this.phase === GamePhase.WAITING;
  }

  public startNewHand(): void {
    this.currentHand++;
    this.currentTrick = 0;
    this.heartsBroken = false;
    this.tricks = [];
    this.phase = GamePhase.DEALING;
    
    // 交換方向を設定
    this.setExchangeDirection();
  }

  public startExchangePhase(): void {
    this.phase = GamePhase.EXCHANGING;
  }

  public startPlayingPhase(): void {
    this.phase = GamePhase.PLAYING;
  }

  public startNewTrick(leadPlayerId: number): void {
    this.currentTrick++;
    this.currentTurn = leadPlayerId;
    
    const newTrick: Trick = {
      trickNumber: this.currentTrick,
      cards: [],
      leadPlayerId,
      points: 0,
      isCompleted: false
    };
    
    this.tricks.push(newTrick);
  }

  public addCardToCurrentTrick(playerId: number, card: Card): boolean {
    const currentTrick = this.getCurrentTrick();
    if (!currentTrick || currentTrick.isCompleted) return false;

    const playedCard: PlayedCard = {
      playerId,
      card,
      playOrder: currentTrick.cards.length + 1
    };

    currentTrick.cards.push(playedCard);
    
    // ハートブレイクのチェック
    if (card.isHearts()) {
      this.heartsBroken = true;
    }

    return true;
  }

  public completeCurrentTrick(): Trick | null {
    const currentTrick = this.getCurrentTrick();
    if (!currentTrick || currentTrick.cards.length !== 4) return null;

    // トリックの勝者を決定
    const winnerId = this.determineTrickWinner(currentTrick);
    currentTrick.winnerId = winnerId;
    
    // ポイントを計算
    currentTrick.points = this.calculateTrickPoints(currentTrick);
    currentTrick.isCompleted = true;

    // 次のトリックのリードプレイヤーを設定
    this.currentTurn = winnerId;

    return currentTrick;
  }

  public completeHand(): HandResult {
    const playerScores = new Map<number, number>();
    let totalPoints = 0;

    // 各プレイヤーのハンドスコアを計算
    this.players.forEach((player, playerId) => {
      let handScore = 0;
      
      this.tricks.forEach(trick => {
        const playerCard = trick.cards.find(pc => pc.playerId === playerId);
        if (playerCard && trick.winnerId === playerId) {
          handScore += trick.points;
        }
      });

      playerScores.set(playerId, handScore);
      totalPoints += handScore;
    });

    // シュートザムーンのチェック
    let shootTheMoonPlayerId: number | undefined;
    playerScores.forEach((score, playerId) => {
      if (score === 26) {
        shootTheMoonPlayerId = playerId;
      }
    });

    // シュートザムーンの場合、スコアを調整
    if (shootTheMoonPlayerId) {
      playerScores.forEach((score, playerId) => {
        if (playerId === shootTheMoonPlayerId) {
          playerScores.set(playerId, 0);
        } else {
          playerScores.set(playerId, 26);
        }
      });
    }

    // 累積スコアを更新
    playerScores.forEach((handScore, playerId) => {
      const currentCumulative = this.cumulativeScores.get(playerId) || 0;
      this.cumulativeScores.set(playerId, currentCumulative + handScore);
    });

    const handResult: HandResult = {
      handNumber: this.currentHand,
      playerScores,
      shootTheMoonPlayerId,
      tricks: [...this.tricks]
    };

    this.handResults.push(handResult);
    
    return handResult;
  }

  public isGameCompleted(): boolean {
    // 誰かが設定された終了点数以上に達したかチェック
    const config = getGameConfig();
    for (const score of this.cumulativeScores.values()) {
      if (score >= config.endScore) {
        return true;
      }
    }
    return false;
  }

  public getWinnerId(): number | null {
    if (!this.isGameCompleted()) return null;

    let winnerId = null;
    let lowestScore = Infinity;

    this.cumulativeScores.forEach((score, playerId) => {
      if (score < lowestScore) {
        lowestScore = score;
        winnerId = playerId;
      }
    });

    return winnerId;
  }

  public getCurrentTrick(): Trick | undefined {
    return this.tricks[this.tricks.length - 1];
  }

  public getCurrentHandScores(): Map<number, number> {
    const currentHandScores = new Map<number, number>();
    
    // 各プレイヤーの初期スコアを0に設定
    this.players.forEach((player, playerId) => {
      currentHandScores.set(playerId, 0);
    });

    // 完了したトリックから現在のハンドスコアを計算
    this.tricks.forEach(trick => {
      if (trick.isCompleted && trick.winnerId) {
        const currentScore = currentHandScores.get(trick.winnerId) || 0;
        currentHandScores.set(trick.winnerId, currentScore + trick.points);
      }
    });

    return currentHandScores;
  }

  public getNextPlayer(currentPlayerId: number): number | null {
    const players = this.getAllPlayers();
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    
    if (currentIndex === -1) return null;
    
    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex].id;
  }

  public canPlayCard(playerId: number, card: Card): boolean {
    const currentTrick = this.getCurrentTrick();
    if (!currentTrick || currentTrick.isCompleted) return false;
    if (this.currentTurn !== playerId) return false;

    const player = this.getPlayer(playerId);
    if (!player || !player.hand.some(c => c.id === card.id)) return false;

    // 最初のトリックではハートかスペードのクイーンは出せない
    if (this.currentHand === 1 && this.currentTrick === 1) {
      if (card.hasPoints()) return false;
    }

    // クラブの2を持っている場合は最初に出さなければならない
    if (this.currentTrick === 1) {
      const hasClubTwo = player.hand.some(c => c.isTwoOfClubs());
      if (hasClubTwo && !card.isTwoOfClubs()) return false;
    }

    // フォローしなければならない
    if (currentTrick.cards.length > 0) {
      const leadSuit = currentTrick.cards[0].card.suit;
      const hasSuit = player.hand.some(c => c.suit === leadSuit);
      
      if (hasSuit && card.suit !== leadSuit) return false;
    }

    // リードでハートを出す場合はハートブレイクが必要
    if (currentTrick.cards.length === 0 && card.isHearts() && !this.heartsBroken) {
      // 他に出せるカードがない場合は例外
      const nonHeartCards = player.hand.filter(c => !c.isHearts());
      if (nonHeartCards.length > 0) return false;
    }

    return true;
  }

  private setExchangeDirection(): void {
    const directions = [ExchangeDirection.LEFT, ExchangeDirection.RIGHT, ExchangeDirection.ACROSS, ExchangeDirection.NONE];
    this.exchangeDirection = directions[(this.currentHand - 1) % 4];
  }

  private determineTrickWinner(trick: Trick): number {
    const leadSuit = trick.cards[0].card.suit;
    let winningCard = trick.cards[0];

    for (let i = 1; i < trick.cards.length; i++) {
      const currentCard = trick.cards[i];
      
      // リードスートをフォローしている場合のみ比較
      if (currentCard.card.suit === leadSuit && 
          currentCard.card.getRankValue() > winningCard.card.getRankValue()) {
        winningCard = currentCard;
      }
    }

    return winningCard.playerId;
  }

  private calculateTrickPoints(trick: Trick): number {
    return trick.cards.reduce((total, playedCard) => {
      return total + playedCard.card.pointValue;
    }, 0);
  }
}