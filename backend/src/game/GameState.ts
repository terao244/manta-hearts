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

  /**
   * 最低得点で同点のプレイヤーが複数いるかどうかを判定する
   * 同点継続ルール: 最低得点者が2人以上いる場合はゲーム継続
   * @returns 最低得点で同点のプレイヤーが2人以上いる場合true
   * @throws Error プレイヤーが0人の場合（通常は発生しない）
   */
  public hasTiedLowestScores(): boolean {
    if (this.cumulativeScores.size === 0) {
      // デバッグ用：通常は発生しないが、安全のためのチェック
      return false;
    }
    
    // 最低得点を取得（型安全性のためのNumberチェック）
    let lowestScore: number = Infinity;
    this.cumulativeScores.forEach((score: number) => {
      if (typeof score === 'number' && score < lowestScore) {
        lowestScore = score;
      }
    });
    
    // 無効な得点の場合のエラーハンドリング
    if (lowestScore === Infinity) {
      return false;
    }
    
    // 最低得点のプレイヤー数をカウント
    let lowestScoreCount: number = 0;
    this.cumulativeScores.forEach((score: number) => {
      if (typeof score === 'number' && score === lowestScore) {
        lowestScoreCount++;
      }
    });
    
    // 2人以上の場合は同点（ゲーム継続）
    return lowestScoreCount >= 2;
  }

  /**
   * ゲームが完了したかどうかを判定する
   * 新ルール: 誰かが終了点数以上に達し、かつ最低得点者が1人のみの場合にゲーム終了
   * 同点の場合はゲーム継続
   * @returns ゲームが完了している場合true
   */
  public isGameCompleted(): boolean {
    const config = getGameConfig();
    
    // 誰かが設定された終了点数以上に達したかチェック
    let hasReachedEndScore = false;
    for (const score of this.cumulativeScores.values()) {
      if (score >= config.endScore) {
        hasReachedEndScore = true;
        break;
      }
    }
    
    // 終了点数に達していない場合はゲーム継続
    if (!hasReachedEndScore) {
      return false;
    }
    
    // 終了点数に達している場合、同点でなければゲーム終了
    // 同点の場合は継続（!this.hasTiedLowestScores()がfalseになる）
    return !this.hasTiedLowestScores();
  }

  /**
   * ゲームの勝者IDを取得する
   * 同点継続ルール対応: 同点の場合はnullを返す
   * @returns 勝者のプレイヤーID、ゲーム未完了または同点の場合はnull
   */
  public getWinnerId(): number | null {
    // ゲームが完了していない場合はnull
    if (!this.isGameCompleted()) return null;

    // 同点の場合もnullを返す（念のための二重チェック）
    if (this.hasTiedLowestScores()) return null;

    // 最低得点のプレイヤーを勝者として返す
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

  public getFinalRankings(): Array<{ playerId: number; rank: number; score: number }> {
    if (!this.isGameCompleted()) return [];

    const scores = Array.from(this.cumulativeScores.entries())
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => a.score - b.score);

    return scores.map((entry, index) => ({
      playerId: entry.playerId,
      rank: index + 1,
      score: entry.score
    }));
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
    const currentPlayer = this.getPlayer(currentPlayerId);
    if (!currentPlayer?.position) {
      // positionが設定されていない場合は従来のロジックを使用
      const players = this.getAllPlayers();
      const currentIndex = players.findIndex(p => p.id === currentPlayerId);
      
      if (currentIndex === -1) return null;
      
      const nextIndex = (currentIndex + 1) % players.length;
      return players[nextIndex].id;
    }
    
    // positionベースの手番順（時計回り）
    const positionOrder = [PlayerPosition.NORTH, PlayerPosition.EAST, PlayerPosition.SOUTH, PlayerPosition.WEST];
    const currentPositionIndex = positionOrder.indexOf(currentPlayer.position);
    
    if (currentPositionIndex === -1) return null;
    
    // 次のposition（時計回り）を取得
    const nextPositionIndex = (currentPositionIndex + 1) % positionOrder.length;
    const nextPosition = positionOrder[nextPositionIndex];
    
    // 該当positionのプレイヤーを探す
    const players = this.getAllPlayers();
    const nextPlayer = players.find(p => p.position === nextPosition);
    
    return nextPlayer?.id || null;
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