import { GameState, GamePhase, GameStatus, ExchangeDirection, Trick } from '../../game/GameState';
import { GamePlayer, PlayerPosition } from '../../game/Player';
import { Card, Suit, Rank } from '../../game/Card';

// gameConfig をモック化
jest.mock('../../config/gameConfig', () => ({
  getGameConfig: jest.fn(() => ({ endScore: 100 }))
}));

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

    it('2ハンド目以降でもクラブの2を持つプレイヤーは最初のトリックでクラブの2を出さなければならない', () => {
      // 2ハンド目のセットアップ
      gameState.currentHand = 2;
      gameState.currentTrick = 1;
      gameState.currentTurn = 1;
      
      const player1 = gameState.getPlayer(1)!;
      player1.hand = [
        new Card(1, Suit.CLUBS, Rank.TWO),
        new Card(2, Suit.CLUBS, Rank.THREE),
        new Card(3, Suit.DIAMONDS, Rank.KING)
      ];
      
      // クラブの2以外は出せない
      const clubsThree = new Card(2, Suit.CLUBS, Rank.THREE);
      expect(gameState.canPlayCard(1, clubsThree)).toBe(false);
      
      const diamondsKing = new Card(3, Suit.DIAMONDS, Rank.KING);
      expect(gameState.canPlayCard(1, diamondsKing)).toBe(false);
      
      // クラブの2は出せる
      const clubsTwo = new Card(1, Suit.CLUBS, Rank.TWO);
      expect(gameState.canPlayCard(1, clubsTwo)).toBe(true);
    });

    it('3ハンド目以降でもクラブの2を持つプレイヤーは最初のトリックでクラブの2を出さなければならない', () => {
      // 3ハンド目のセットアップ
      gameState.currentHand = 3;
      gameState.currentTrick = 1;
      gameState.currentTurn = 2;
      
      const player2 = gameState.getPlayer(2)!;
      player2.hand = [
        new Card(1, Suit.CLUBS, Rank.TWO),
        new Card(4, Suit.SPADES, Rank.KING),
        new Card(5, Suit.HEARTS, Rank.QUEEN)
      ];
      
      // クラブの2以外は出せない
      const spadesKing = new Card(4, Suit.SPADES, Rank.KING);
      expect(gameState.canPlayCard(2, spadesKing)).toBe(false);
      
      const heartsQueen = new Card(5, Suit.HEARTS, Rank.QUEEN);
      expect(gameState.canPlayCard(2, heartsQueen)).toBe(false);
      
      // クラブの2は出せる
      const clubsTwo = new Card(1, Suit.CLUBS, Rank.TWO);
      expect(gameState.canPlayCard(2, clubsTwo)).toBe(true);
    });
  });

  describe('isGameCompleted', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
    });

    it('誰かが100点以上になるとゲーム終了', () => {
      gameState.cumulativeScores.set(1, 105);
      gameState.cumulativeScores.set(2, 50);  // 最低点（1人のみ）
      gameState.cumulativeScores.set(3, 60);
      gameState.cumulativeScores.set(4, 70);
      
      expect(gameState.isGameCompleted()).toBe(true);
    });

    it('全員100点未満だとゲーム継続', () => {
      gameState.cumulativeScores.set(1, 95);
      gameState.cumulativeScores.set(2, 80);
      gameState.cumulativeScores.set(3, 85);
      gameState.cumulativeScores.set(4, 90);
      
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
      gameState.cumulativeScores.set(3, 70);
      gameState.cumulativeScores.set(4, 80);
      
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

  describe('getCurrentHandScores', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
    });

    it('初期状態では全プレイヤーのスコアが0', () => {
      const currentHandScores = gameState.getCurrentHandScores();
      
      expect(currentHandScores.get(1)).toBe(0);
      expect(currentHandScores.get(2)).toBe(0);
      expect(currentHandScores.get(3)).toBe(0);
      expect(currentHandScores.get(4)).toBe(0);
    });

    it('完了したトリックから現在ハンドスコアを計算', () => {
      // トリック1: プレイヤー1が勝利、ハート3枚で3点獲得
      const trick1: Trick = {
        trickNumber: 1,
        cards: [
          { playerId: 1, card: new Card(1, Suit.HEARTS, Rank.ACE), playOrder: 1 },
          { playerId: 2, card: new Card(2, Suit.HEARTS, Rank.TWO), playOrder: 2 },
          { playerId: 3, card: new Card(3, Suit.HEARTS, Rank.THREE), playOrder: 3 },
          { playerId: 4, card: new Card(4, Suit.CLUBS, Rank.FOUR), playOrder: 4 }
        ],
        leadPlayerId: 1,
        winnerId: 1,
        points: 3,
        isCompleted: true
      };

      // トリック2: プレイヤー2が勝利、スペードのクイーンで13点獲得
      const trick2: Trick = {
        trickNumber: 2,
        cards: [
          { playerId: 1, card: new Card(5, Suit.CLUBS, Rank.FIVE), playOrder: 1 },
          { playerId: 2, card: new Card(6, Suit.SPADES, Rank.QUEEN), playOrder: 2 },
          { playerId: 3, card: new Card(7, Suit.CLUBS, Rank.SEVEN), playOrder: 3 },
          { playerId: 4, card: new Card(8, Suit.CLUBS, Rank.EIGHT), playOrder: 4 }
        ],
        leadPlayerId: 1,
        winnerId: 2,
        points: 13,
        isCompleted: true
      };

      gameState.tricks = [trick1, trick2];

      const currentHandScores = gameState.getCurrentHandScores();
      
      expect(currentHandScores.get(1)).toBe(3);   // プレイヤー1はハート3点
      expect(currentHandScores.get(2)).toBe(13);  // プレイヤー2はスペードのクイーン13点
      expect(currentHandScores.get(3)).toBe(0);   // プレイヤー3は0点
      expect(currentHandScores.get(4)).toBe(0);   // プレイヤー4は0点
    });

    it('未完了のトリックは計算に含まれない', () => {
      // 完了したトリック
      const completedTrick: Trick = {
        trickNumber: 1,
        cards: [
          { playerId: 1, card: new Card(1, Suit.HEARTS, Rank.ACE), playOrder: 1 },
          { playerId: 2, card: new Card(2, Suit.CLUBS, Rank.TWO), playOrder: 2 },
          { playerId: 3, card: new Card(3, Suit.CLUBS, Rank.THREE), playOrder: 3 },
          { playerId: 4, card: new Card(4, Suit.CLUBS, Rank.FOUR), playOrder: 4 }
        ],
        leadPlayerId: 1,
        winnerId: 1,
        points: 1,
        isCompleted: true
      };

      // 未完了のトリック
      const incompleteTrick: Trick = {
        trickNumber: 2,
        cards: [
          { playerId: 1, card: new Card(5, Suit.HEARTS, Rank.FIVE), playOrder: 1 },
          { playerId: 2, card: new Card(6, Suit.HEARTS, Rank.SIX), playOrder: 2 }
        ],
        leadPlayerId: 1,
        winnerId: 2,
        points: 2,
        isCompleted: false  // 未完了
      };

      gameState.tricks = [completedTrick, incompleteTrick];

      const currentHandScores = gameState.getCurrentHandScores();
      
      expect(currentHandScores.get(1)).toBe(1);   // 完了したトリックのみカウント
      expect(currentHandScores.get(2)).toBe(0);   // 未完了トリックはカウントしない
      expect(currentHandScores.get(3)).toBe(0);
      expect(currentHandScores.get(4)).toBe(0);
    });
  });

  // 同点時ゲーム継続機能のテスト（TDD RED Phase）
  describe('hasTiedLowestScores - 同点判定メソッド', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
    });

    it('2人同点時にtrueを返す', () => {
      gameState.cumulativeScores.set(1, 90);
      gameState.cumulativeScores.set(2, 90);  // 同点
      gameState.cumulativeScores.set(3, 100);
      gameState.cumulativeScores.set(4, 95);
      
      expect(gameState.hasTiedLowestScores()).toBe(true);
    });

    it('3人同点時にtrueを返す', () => {
      gameState.cumulativeScores.set(1, 85);  // 同点
      gameState.cumulativeScores.set(2, 85);  // 同点
      gameState.cumulativeScores.set(3, 85);  // 同点
      gameState.cumulativeScores.set(4, 100);
      
      expect(gameState.hasTiedLowestScores()).toBe(true);
    });

    it('4人同点時にtrueを返す', () => {
      gameState.cumulativeScores.set(1, 80);  // 同点
      gameState.cumulativeScores.set(2, 80);  // 同点
      gameState.cumulativeScores.set(3, 80);  // 同点
      gameState.cumulativeScores.set(4, 80);  // 同点
      
      expect(gameState.hasTiedLowestScores()).toBe(true);
    });

    it('1人最低点時にfalseを返す', () => {
      gameState.cumulativeScores.set(1, 75);  // 最低点（1人のみ）
      gameState.cumulativeScores.set(2, 90);
      gameState.cumulativeScores.set(3, 95);
      gameState.cumulativeScores.set(4, 85);
      
      expect(gameState.hasTiedLowestScores()).toBe(false);
    });

    it('0点台での同点テスト', () => {
      gameState.cumulativeScores.set(1, 5);   // 同点
      gameState.cumulativeScores.set(2, 5);   // 同点
      gameState.cumulativeScores.set(3, 10);
      gameState.cumulativeScores.set(4, 15);
      
      expect(gameState.hasTiedLowestScores()).toBe(true);
    });
  });

  describe('isGameCompleted - 同点継続機能対応', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
    });

    it('終了点数超過かつ同点時にfalseを返す（ゲーム継続）', () => {
      gameState.cumulativeScores.set(1, 105);  // 終了点数超過
      gameState.cumulativeScores.set(2, 85);   // 同点最低点
      gameState.cumulativeScores.set(3, 85);   // 同点最低点
      gameState.cumulativeScores.set(4, 90);
      
      expect(gameState.isGameCompleted()).toBe(false);
    });

    it('終了点数超過かつ勝者1人時にtrueを返す（ゲーム終了）', () => {
      gameState.cumulativeScores.set(1, 105);  // 終了点数超過
      gameState.cumulativeScores.set(2, 75);   // 最低点（1人のみ）
      gameState.cumulativeScores.set(3, 90);
      gameState.cumulativeScores.set(4, 85);
      
      expect(gameState.isGameCompleted()).toBe(true);
    });

    it('終了点数未達時にfalseを返す', () => {
      gameState.cumulativeScores.set(1, 95);
      gameState.cumulativeScores.set(2, 90);
      gameState.cumulativeScores.set(3, 85);
      gameState.cumulativeScores.set(4, 80);
      
      expect(gameState.isGameCompleted()).toBe(false);
    });
  });

  describe('getWinnerId - 同点時処理対応', () => {
    beforeEach(() => {
      mockPlayers.forEach(player => gameState.addPlayer(player));
    });

    it('同点時にnullを返す', () => {
      gameState.cumulativeScores.set(1, 105);  // 終了点数超過
      gameState.cumulativeScores.set(2, 85);   // 同点最低点
      gameState.cumulativeScores.set(3, 85);   // 同点最低点
      gameState.cumulativeScores.set(4, 90);
      
      expect(gameState.getWinnerId()).toBeNull();
    });

    it('勝者確定時に正しいIDを返す', () => {
      gameState.cumulativeScores.set(1, 105);  // 終了点数超過
      gameState.cumulativeScores.set(2, 75);   // 最低点（勝者）
      gameState.cumulativeScores.set(3, 90);
      gameState.cumulativeScores.set(4, 85);
      
      expect(gameState.getWinnerId()).toBe(2);
    });
  });
});