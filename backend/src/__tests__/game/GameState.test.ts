import { GameState, GamePhase, GameStatus, ExchangeDirection, Trick } from '../../game/GameState';
import { GamePlayer, PlayerPosition } from '../../game/Player';
import { Card, Suit, Rank } from '../../game/Card';

describe('GameState', () => {
  let gameState: GameState;
  let mockPlayers: GamePlayer[];

  beforeEach(() => {
    gameState = new GameState(1);
    
    mockPlayers = [
      {
        id: 1,
        name: 'Player1',
        displayName: 'Player 1',
        position: PlayerPosition.NORTH,
        hand: [],
        score: 0,
        cumulativeScore: 0,
        isConnected: true,
        lastActiveAt: new Date(),
        hasExchanged: false,
        hasPlayedInTrick: false
      },
      {
        id: 2,
        name: 'Player2',
        displayName: 'Player 2',
        position: PlayerPosition.EAST,
        hand: [],
        score: 0,
        cumulativeScore: 0,
        isConnected: true,
        lastActiveAt: new Date(),
        hasExchanged: false,
        hasPlayedInTrick: false
      },
      {
        id: 3,
        name: 'Player3',
        displayName: 'Player 3',
        position: PlayerPosition.SOUTH,
        hand: [],
        score: 0,
        cumulativeScore: 0,
        isConnected: true,
        lastActiveAt: new Date(),
        hasExchanged: false,
        hasPlayedInTrick: false
      },
      {
        id: 4,
        name: 'Player4',
        displayName: 'Player 4',
        position: PlayerPosition.WEST,
        hand: [],
        score: 0,
        cumulativeScore: 0,
        isConnected: true,
        lastActiveAt: new Date(),
        hasExchanged: false,
        hasPlayedInTrick: false
      }
    ];
  });

  describe('constructor', () => {
    it('正しい初期状態でゲームを作成する', () => {
      expect(gameState.gameId).toBe(1);
      expect(gameState.status).toBe(GameStatus.PLAYING);
      expect(gameState.phase).toBe(GamePhase.WAITING);
      expect(gameState.currentHand).toBe(0);
      expect(gameState.currentTrick).toBe(0);
      expect(gameState.heartsBroken).toBe(false);
      expect(gameState.exchangeDirection).toBe(ExchangeDirection.LEFT);
      expect(gameState.getPlayerCount()).toBe(0);
    });
  });

  describe('addPlayer', () => {
    it('プレイヤーを追加する', () => {
      const success = gameState.addPlayer(mockPlayers[0]);
      
      expect(success).toBe(true);
      expect(gameState.getPlayerCount()).toBe(1);
      expect(gameState.getPlayer(1)).toBeDefined();
    });

    it('5人目のプレイヤー追加は失敗する', () => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
      
      const extraPlayer = { ...mockPlayers[0], id: 5 };
      const success = gameState.addPlayer(extraPlayer);
      
      expect(success).toBe(false);
      expect(gameState.getPlayerCount()).toBe(4);
    });
  });

  describe('isFull', () => {
    it('4人のプレイヤーがいる場合trueを返す', () => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
      expect(gameState.isFull()).toBe(true);
    });

    it('4人未満の場合falseを返す', () => {
      gameState.addPlayer(mockPlayers[0]);
      expect(gameState.isFull()).toBe(false);
    });
  });

  describe('startNewHand', () => {
    it('新しいハンドを開始する', () => {
      gameState.startNewHand();
      
      expect(gameState.currentHand).toBe(1);
      expect(gameState.currentTrick).toBe(0);
      expect(gameState.heartsBroken).toBe(false);
      expect(gameState.phase).toBe(GamePhase.DEALING);
      expect(gameState.tricks.length).toBe(0);
    });

    it('交換方向を正しく設定する', () => {
      gameState.startNewHand(); // Hand 1: LEFT
      expect(gameState.exchangeDirection).toBe(ExchangeDirection.LEFT);
      
      gameState.startNewHand(); // Hand 2: RIGHT
      expect(gameState.exchangeDirection).toBe(ExchangeDirection.RIGHT);
      
      gameState.startNewHand(); // Hand 3: ACROSS
      expect(gameState.exchangeDirection).toBe(ExchangeDirection.ACROSS);
      
      gameState.startNewHand(); // Hand 4: NONE
      expect(gameState.exchangeDirection).toBe(ExchangeDirection.NONE);
      
      gameState.startNewHand(); // Hand 5: LEFT (循環)
      expect(gameState.exchangeDirection).toBe(ExchangeDirection.LEFT);
    });
  });

  describe('startNewTrick', () => {
    it('新しいトリックを開始する', () => {
      gameState.startNewTrick(1);
      
      expect(gameState.currentTrick).toBe(1);
      expect(gameState.currentTurn).toBe(1);
      expect(gameState.tricks.length).toBe(1);
      
      const currentTrick = gameState.getCurrentTrick();
      expect(currentTrick?.trickNumber).toBe(1);
      expect(currentTrick?.leadPlayerId).toBe(1);
      expect(currentTrick?.cards.length).toBe(0);
      expect(currentTrick?.isCompleted).toBe(false);
    });
  });

  describe('addCardToCurrentTrick', () => {
    beforeEach(() => {
      gameState.startNewTrick(1);
    });

    it('カードをトリックに追加する', () => {
      const card = new Card(1, Suit.HEARTS, Rank.ACE);
      const success = gameState.addCardToCurrentTrick(1, card);
      
      expect(success).toBe(true);
      
      const currentTrick = gameState.getCurrentTrick();
      expect(currentTrick?.cards.length).toBe(1);
      expect(currentTrick?.cards[0].playerId).toBe(1);
      expect(currentTrick?.cards[0].card).toBe(card);
      expect(currentTrick?.cards[0].playOrder).toBe(1);
    });

    it('ハートのカードでハートブレイクを設定する', () => {
      const heartCard = new Card(1, Suit.HEARTS, Rank.ACE);
      gameState.addCardToCurrentTrick(1, heartCard);
      
      expect(gameState.heartsBroken).toBe(true);
    });

    it('完了したトリックには追加できない', () => {
      const currentTrick = gameState.getCurrentTrick()!;
      currentTrick.isCompleted = true;
      
      const card = new Card(1, Suit.HEARTS, Rank.ACE);
      const success = gameState.addCardToCurrentTrick(1, card);
      
      expect(success).toBe(false);
    });
  });

  describe('completeCurrentTrick', () => {
    beforeEach(() => {
      gameState.startNewTrick(1);
    });

    it('4枚のカードでトリックを完了する', () => {
      const cards = [
        new Card(1, Suit.CLUBS, Rank.TWO),   // Lead: Clubs Two
        new Card(2, Suit.CLUBS, Rank.ACE),   // Highest Clubs
        new Card(3, Suit.CLUBS, Rank.KING),  
        new Card(4, Suit.CLUBS, Rank.QUEEN)
      ];

      cards.forEach((card, index) => {
        gameState.addCardToCurrentTrick(index + 1, card);
      });

      const completedTrick = gameState.completeCurrentTrick();
      
      expect(completedTrick).toBeDefined();
      expect(completedTrick?.isCompleted).toBe(true);
      expect(completedTrick?.winnerId).toBe(2); // Player 2 played Ace
      expect(gameState.currentTurn).toBe(2); // Next lead
    });

    it('4枚未満では完了できない', () => {
      const card = new Card(1, Suit.CLUBS, Rank.TWO);
      gameState.addCardToCurrentTrick(1, card);
      
      const completedTrick = gameState.completeCurrentTrick();
      expect(completedTrick).toBeNull();
    });

    it('ポイントカードのトリックで正しくポイントを計算する', () => {
      const cards = [
        new Card(1, Suit.HEARTS, Rank.TWO),    // 1 point
        new Card(2, Suit.HEARTS, Rank.ACE),    // 1 point  
        new Card(3, Suit.SPADES, Rank.QUEEN),  // 13 points
        new Card(4, Suit.HEARTS, Rank.KING)    // 1 point
      ];

      cards.forEach((card, index) => {
        gameState.addCardToCurrentTrick(index + 1, card);
      });

      const completedTrick = gameState.completeCurrentTrick();
      expect(completedTrick?.points).toBe(16); // 1+1+13+1
    });
  });

  describe('canPlayCard', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
      gameState.startNewHand();
      gameState.startNewTrick(1);
      
      // Player 1に手札を設定
      const player1 = gameState.getPlayer(1)!;
      player1.hand = [
        new Card(1, Suit.CLUBS, Rank.TWO),
        new Card(2, Suit.HEARTS, Rank.ACE),
        new Card(3, Suit.SPADES, Rank.KING),
        new Card(4, Suit.DIAMONDS, Rank.QUEEN)
      ];
    });

    it('自分のターンで手札にあるカードは出せる', () => {
      gameState.currentTurn = 1;
      const card = new Card(1, Suit.CLUBS, Rank.TWO);
      
      expect(gameState.canPlayCard(1, card)).toBe(true);
    });

    it('自分のターンでなければ出せない', () => {
      gameState.currentTurn = 2;
      const card = new Card(1, Suit.CLUBS, Rank.TWO);
      
      expect(gameState.canPlayCard(1, card)).toBe(false);
    });

    it('手札にないカードは出せない', () => {
      gameState.currentTurn = 1;
      const card = new Card(999, Suit.CLUBS, Rank.THREE);
      
      expect(gameState.canPlayCard(1, card)).toBe(false);
    });

    it('フォローしなければならない', () => {
      gameState.currentTurn = 1;
      
      // Player 1がクラブを出す
      const clubsCard = new Card(1, Suit.CLUBS, Rank.TWO);
      gameState.addCardToCurrentTrick(1, clubsCard);
      
      // Player 2のターン、クラブを持っているのにハートは出せない
      gameState.currentTurn = 2;
      const player2 = gameState.getPlayer(2)!;
      player2.hand = [
        new Card(5, Suit.CLUBS, Rank.ACE),
        new Card(6, Suit.HEARTS, Rank.KING)
      ];
      
      const heartsCard = new Card(6, Suit.HEARTS, Rank.KING);
      expect(gameState.canPlayCard(2, heartsCard)).toBe(false);
      
      const clubsCard2 = new Card(5, Suit.CLUBS, Rank.ACE);
      expect(gameState.canPlayCard(2, clubsCard2)).toBe(true);
    });

    it('最初のトリックではポイントカードは出せない', () => {
      gameState.currentHand = 1;
      gameState.currentTrick = 1;
      gameState.currentTurn = 1;
      
      const heartCard = new Card(2, Suit.HEARTS, Rank.ACE);
      expect(gameState.canPlayCard(1, heartCard)).toBe(false);
      
      const queenOfSpades = new Card(3, Suit.SPADES, Rank.QUEEN);
      expect(gameState.canPlayCard(1, queenOfSpades)).toBe(false);
      
      const clubsCard = new Card(1, Suit.CLUBS, Rank.TWO);
      expect(gameState.canPlayCard(1, clubsCard)).toBe(true);
    });
  });

  describe('isGameCompleted', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
    });

    it('誰かが100点以上になるとゲーム終了', () => {
      gameState.cumulativeScores.set(1, 105);
      gameState.cumulativeScores.set(2, 50);
      
      expect(gameState.isGameCompleted()).toBe(true);
    });

    it('全員100点未満だとゲーム継続', () => {
      gameState.cumulativeScores.set(1, 95);
      gameState.cumulativeScores.set(2, 80);
      
      expect(gameState.isGameCompleted()).toBe(false);
    });
  });

  describe('getWinnerId', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
    });

    it('最低スコアのプレイヤーが勝者', () => {
      gameState.cumulativeScores.set(1, 105);
      gameState.cumulativeScores.set(2, 95);  // 最低スコア
      gameState.cumulativeScores.set(3, 110);
      gameState.cumulativeScores.set(4, 100);
      
      expect(gameState.getWinnerId()).toBe(2);
    });

    it('ゲーム未完了時はnullを返す', () => {
      gameState.cumulativeScores.set(1, 50);
      gameState.cumulativeScores.set(2, 60);
      
      expect(gameState.getWinnerId()).toBeNull();
    });
  });

  describe('getNextPlayer', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
    });

    it('次のプレイヤーIDを返す', () => {
      expect(gameState.getNextPlayer(1)).toBe(2);
      expect(gameState.getNextPlayer(2)).toBe(3);
      expect(gameState.getNextPlayer(3)).toBe(4);
      expect(gameState.getNextPlayer(4)).toBe(1); // 循環
    });

    it('存在しないプレイヤーでnullを返す', () => {
      expect(gameState.getNextPlayer(999)).toBeNull();
    });
  });
});