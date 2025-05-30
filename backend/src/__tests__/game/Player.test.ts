import { PlayerManager, PlayerPosition, Player, GamePlayer } from '../../game/Player';
import { Card, Suit, Rank } from '../../game/Card';

describe('PlayerManager', () => {
  let playerManager: PlayerManager;
  let mockPlayer: Player;
  let testCards: Card[];

  beforeEach(() => {
    playerManager = new PlayerManager();
    mockPlayer = {
      id: 1,
      name: 'TestPlayer',
      displayName: 'Test Player',
      position: PlayerPosition.NORTH,
      hand: [],
      score: 0,
      cumulativeScore: 0,
      isConnected: true,
      lastActiveAt: new Date()
    };

    testCards = [
      new Card(1, Suit.HEARTS, Rank.ACE),
      new Card(2, Suit.SPADES, Rank.KING),
      new Card(3, Suit.CLUBS, Rank.TWO)
    ];
  });

  describe('addPlayer', () => {
    it('プレイヤーを追加してGamePlayerを返す', () => {
      const gamePlayer = playerManager.addPlayer(mockPlayer);

      expect(gamePlayer.id).toBe(mockPlayer.id);
      expect(gamePlayer.name).toBe(mockPlayer.name);
      expect(gamePlayer.hasExchanged).toBe(false);
      expect(gamePlayer.hasPlayedInTrick).toBe(false);
      expect(gamePlayer.exchangeCards).toBeUndefined();
    });

    it('プレイヤーを位置マップに追加する', () => {
      playerManager.addPlayer(mockPlayer);
      const retrievedPlayer = playerManager.getPlayerByPosition(PlayerPosition.NORTH);

      expect(retrievedPlayer?.id).toBe(mockPlayer.id);
    });
  });

  describe('getPlayer', () => {
    it('存在するプレイヤーを返す', () => {
      playerManager.addPlayer(mockPlayer);
      const retrievedPlayer = playerManager.getPlayer(1);

      expect(retrievedPlayer?.id).toBe(1);
    });

    it('存在しないプレイヤーでundefinedを返す', () => {
      const retrievedPlayer = playerManager.getPlayer(999);
      expect(retrievedPlayer).toBeUndefined();
    });
  });

  describe('dealCards', () => {
    it('プレイヤーにカードを配る', () => {
      playerManager.addPlayer(mockPlayer);
      playerManager.dealCards(1, testCards);

      const player = playerManager.getPlayer(1);
      expect(player?.hand.length).toBe(3);
      expect(player?.hand).toEqual(expect.arrayContaining(testCards));
    });

    it('カードをソートして配る', () => {
      playerManager.addPlayer(mockPlayer);
      const unsortedCards = [testCards[1], testCards[0], testCards[2]]; // King, Ace, Two
      playerManager.dealCards(1, unsortedCards);

      const player = playerManager.getPlayer(1);
      // ソート順を確認（クラブ→スペード→ハート、ランク順）
      expect(player?.hand[0].suit).toBe(Suit.CLUBS);
      expect(player?.hand[1].suit).toBe(Suit.SPADES);
      expect(player?.hand[2].suit).toBe(Suit.HEARTS);
    });
  });

  describe('playCard', () => {
    beforeEach(() => {
      playerManager.addPlayer(mockPlayer);
      playerManager.dealCards(1, testCards);
    });

    it('指定されたカードをプレイして手札から削除する', () => {
      const playedCard = playerManager.playCard(1, 1); // Hearts Ace

      expect(playedCard?.id).toBe(1);
      expect(playedCard?.suit).toBe(Suit.HEARTS);
      
      const player = playerManager.getPlayer(1);
      expect(player?.hand.length).toBe(2);
      expect(player?.hand.some(c => c.id === 1)).toBe(false);
      expect(player?.hasPlayedInTrick).toBe(true);
    });

    it('存在しないカードでnullを返す', () => {
      const playedCard = playerManager.playCard(1, 999);
      expect(playedCard).toBeNull();
    });

    it('存在しないプレイヤーでnullを返す', () => {
      const playedCard = playerManager.playCard(999, 1);
      expect(playedCard).toBeNull();
    });
  });

  describe('setExchangeCards', () => {
    beforeEach(() => {
      playerManager.addPlayer(mockPlayer);
      playerManager.dealCards(1, testCards);
    });

    it('3枚のカードを交換用に設定する', () => {
      const success = playerManager.setExchangeCards(1, [1, 2, 3]);

      expect(success).toBe(true);
      
      const player = playerManager.getPlayer(1);
      expect(player?.exchangeCards?.length).toBe(3);
      expect(player?.hasExchanged).toBe(true);
      expect(player?.hand.length).toBe(0); // 手札から削除される
    });

    it('3枚でない場合は失敗する', () => {
      const success = playerManager.setExchangeCards(1, [1, 2]);
      expect(success).toBe(false);
      
      const player = playerManager.getPlayer(1);
      expect(player?.hasExchanged).toBe(false);
    });

    it('存在しないカードがある場合は失敗して手札を復元する', () => {
      const originalHandSize = playerManager.getPlayer(1)?.hand.length || 0;
      const success = playerManager.setExchangeCards(1, [1, 2, 999]);
      
      expect(success).toBe(false);
      
      const player = playerManager.getPlayer(1);
      expect(player?.hand.length).toBe(originalHandSize);
      expect(player?.hasExchanged).toBe(false);
    });
  });

  describe('updateScore', () => {
    it('プレイヤーのスコアを更新する', () => {
      playerManager.addPlayer(mockPlayer);
      playerManager.updateScore(1, 5);

      const player = playerManager.getPlayer(1);
      expect(player?.score).toBe(5);
      expect(player?.cumulativeScore).toBe(5);
    });

    it('累積スコアに加算する', () => {
      const playerWithScore = { ...mockPlayer, cumulativeScore: 10 };
      playerManager.addPlayer(playerWithScore);
      playerManager.updateScore(1, 7);

      const player = playerManager.getPlayer(1);
      expect(player?.score).toBe(7);
      expect(player?.cumulativeScore).toBe(17);
    });
  });

  describe('resetTrickFlags', () => {
    it('全プレイヤーのトリックフラグをリセットする', () => {
      const player1 = { ...mockPlayer, id: 1, position: PlayerPosition.NORTH };
      const player2 = { ...mockPlayer, id: 2, position: PlayerPosition.EAST };
      
      playerManager.addPlayer(player1);
      playerManager.addPlayer(player2);
      
      // フラグを設定
      playerManager.playCard(1, 1); // これでhasPlayedInTrickがtrueになる
      
      playerManager.resetTrickFlags();
      
      expect(playerManager.getPlayer(1)?.hasPlayedInTrick).toBe(false);
      expect(playerManager.getPlayer(2)?.hasPlayedInTrick).toBe(false);
    });
  });

  describe('resetForNewHand', () => {
    it('新しいハンドのためにプレイヤーをリセットする', () => {
      playerManager.addPlayer(mockPlayer);
      playerManager.dealCards(1, testCards);
      playerManager.setExchangeCards(1, [1, 2, 3]);
      playerManager.updateScore(1, 5);

      playerManager.resetForNewHand();

      const player = playerManager.getPlayer(1);
      expect(player?.hand.length).toBe(0);
      expect(player?.exchangeCards).toBeUndefined();
      expect(player?.hasExchanged).toBe(false);
      expect(player?.hasPlayedInTrick).toBe(false);
      expect(player?.score).toBe(0);
      expect(player?.cumulativeScore).toBe(5); // 累積スコアは維持
    });
  });

  describe('allPlayersExchanged', () => {
    it('全プレイヤーが交換済みの場合trueを返す', () => {
      const player1 = { ...mockPlayer, id: 1, position: PlayerPosition.NORTH };
      const player2 = { ...mockPlayer, id: 2, position: PlayerPosition.EAST };
      
      playerManager.addPlayer(player1);
      playerManager.addPlayer(player2);
      
      // 両方のプレイヤーに十分なカードを配る
      playerManager.dealCards(1, testCards);
      playerManager.dealCards(2, [
        new Card(4, Suit.DIAMONDS, Rank.JACK),
        new Card(5, Suit.CLUBS, Rank.QUEEN),
        new Card(6, Suit.HEARTS, Rank.KING)
      ]);
      
      playerManager.setExchangeCards(1, [1, 2, 3]);
      playerManager.setExchangeCards(2, [4, 5, 6]);

      expect(playerManager.allPlayersExchanged()).toBe(true);
    });

    it('一部のプレイヤーが未交換の場合falseを返す', () => {
      const player1 = { ...mockPlayer, id: 1, position: PlayerPosition.NORTH };
      const player2 = { ...mockPlayer, id: 2, position: PlayerPosition.EAST };
      
      playerManager.addPlayer(player1);
      playerManager.addPlayer(player2);
      
      playerManager.dealCards(1, testCards);
      playerManager.setExchangeCards(1, [1, 2, 3]);
      // player2は交換していない

      expect(playerManager.allPlayersExchanged()).toBe(false);
    });
  });
});

describe('PlayerPosition', () => {
  describe('getNextPosition', () => {
    it('正しい次のポジションを返す', () => {
      expect(PlayerManager.getNextPosition(PlayerPosition.NORTH)).toBe(PlayerPosition.EAST);
      expect(PlayerManager.getNextPosition(PlayerPosition.EAST)).toBe(PlayerPosition.SOUTH);
      expect(PlayerManager.getNextPosition(PlayerPosition.SOUTH)).toBe(PlayerPosition.WEST);
      expect(PlayerManager.getNextPosition(PlayerPosition.WEST)).toBe(PlayerPosition.NORTH);
    });
  });

  describe('getPositionById', () => {
    it('インデックスに対応するポジションを返す', () => {
      expect(PlayerManager.getPositionById(0)).toBe(PlayerPosition.NORTH);
      expect(PlayerManager.getPositionById(1)).toBe(PlayerPosition.EAST);
      expect(PlayerManager.getPositionById(2)).toBe(PlayerPosition.SOUTH);
      expect(PlayerManager.getPositionById(3)).toBe(PlayerPosition.WEST);
      expect(PlayerManager.getPositionById(4)).toBe(PlayerPosition.NORTH); // 循環
    });
  });
});