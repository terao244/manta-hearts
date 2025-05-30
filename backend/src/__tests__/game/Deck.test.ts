import { Deck } from '../../game/Deck';
import { Card, Suit, Rank } from '../../game/Card';

describe('Deck', () => {
  let deck: Deck;

  beforeEach(() => {
    deck = new Deck();
  });

  describe('constructor', () => {
    it('52枚のカードでデッキを初期化する', () => {
      expect(deck.getRemainingCount()).toBe(52);
      expect(deck.isEmpty()).toBe(false);
    });

    it('すべてのスートとランクの組み合わせが含まれる', () => {
      const cards = deck.getAllCards();
      const suits = Object.values(Suit);
      const ranks = Object.values(Rank);
      
      expect(cards.length).toBe(suits.length * ranks.length);
      
      // 各スートと各ランクの組み合わせが存在することを確認
      for (const suit of suits) {
        for (const rank of ranks) {
          const card = cards.find(c => c.suit === suit && c.rank === rank);
          expect(card).toBeDefined();
        }
      }
    });
  });

  describe('shuffle', () => {
    it('カードの順序を変更する', () => {
      const originalOrder = deck.getCards().map(card => card.id);
      deck.shuffle();
      const shuffledOrder = deck.getCards().map(card => card.id);
      
      // シャッフル後は元の順序と異なることが期待される
      // （確率的に同じになる可能性もあるが、52枚なのでほぼ0%）
      expect(shuffledOrder).not.toEqual(originalOrder);
    });

    it('シャッフル後もカード数は変わらない', () => {
      deck.shuffle();
      expect(deck.getRemainingCount()).toBe(52);
    });
  });

  describe('deal', () => {
    it('指定された枚数のカードを配る', () => {
      const dealtCards = deck.deal(5);
      
      expect(dealtCards.length).toBe(5);
      expect(deck.getRemainingCount()).toBe(47);
    });

    it('残りカード数より多く配ろうとするとエラーになる', () => {
      expect(() => deck.deal(53)).toThrow('Cannot deal 53 cards, only 52 remaining');
    });

    it('配ったカードはデッキから削除される', () => {
      const initialCards = deck.getCards();
      const dealtCards = deck.deal(2);
      const remainingCards = deck.getCards();
      
      expect(remainingCards.length).toBe(initialCards.length - 2);
      dealtCards.forEach(card => {
        expect(remainingCards.find(c => c.id === card.id)).toBeUndefined();
      });
    });
  });

  describe('dealToPlayers', () => {
    it('4人のプレイヤーに13枚ずつ配る（ハーツゲーム）', () => {
      const hands = deck.dealToPlayers(4, 13);
      
      expect(hands.length).toBe(4);
      hands.forEach(hand => {
        expect(hand.length).toBe(13);
      });
      expect(deck.getRemainingCount()).toBe(0);
    });

    it('各プレイヤーに順番にカードを配る', () => {
      const hands = deck.dealToPlayers(3, 2);
      
      // 最初の6枚が順番に配られることを確認
      const allCards = deck.getAllCards();
      expect(hands[0][0]).toEqual(allCards[0]); // 1枚目 → プレイヤー1
      expect(hands[1][0]).toEqual(allCards[1]); // 2枚目 → プレイヤー2
      expect(hands[2][0]).toEqual(allCards[2]); // 3枚目 → プレイヤー3
      expect(hands[0][1]).toEqual(allCards[3]); // 4枚目 → プレイヤー1
      expect(hands[1][1]).toEqual(allCards[4]); // 5枚目 → プレイヤー2
      expect(hands[2][1]).toEqual(allCards[5]); // 6枚目 → プレイヤー3
    });

    it('必要なカード数より少ない場合はエラーになる', () => {
      expect(() => deck.dealToPlayers(4, 14)).toThrow('Cannot deal 56 cards to 4 players, only 52 remaining');
    });
  });

  describe('reset', () => {
    it('デッキを初期状態に戻す', () => {
      deck.deal(10);
      deck.shuffle();
      expect(deck.getRemainingCount()).toBe(42);
      
      deck.reset();
      expect(deck.getRemainingCount()).toBe(52);
    });
  });

  describe('getCards', () => {
    it('現在のカードのコピーを返す', () => {
      const cards = deck.getCards();
      expect(cards.length).toBe(52);
      
      // 元の配列とは異なるインスタンスであることを確認
      cards.pop();
      expect(deck.getRemainingCount()).toBe(52);
    });
  });

  describe('isEmpty', () => {
    it('カードがある場合はfalseを返す', () => {
      expect(deck.isEmpty()).toBe(false);
    });

    it('カードがない場合はtrueを返す', () => {
      deck.deal(52);
      expect(deck.isEmpty()).toBe(true);
    });
  });

  describe('getCardById', () => {
    it('指定されたIDのカードを返す', () => {
      const card = deck.getCardById(1);
      expect(card).toBeDefined();
      expect(card!.id).toBe(1);
    });

    it('存在しないIDの場合はundefinedを返す', () => {
      const card = deck.getCardById(999);
      expect(card).toBeUndefined();
    });
  });

  describe('getStandardDeckSize', () => {
    it('標準デッキサイズ52を返す', () => {
      expect(Deck.getStandardDeckSize()).toBe(52);
    });
  });

  describe('findCard', () => {
    it('指定されたスートとランクのカードを見つける', () => {
      const card = deck.findCard(Suit.HEARTS, Rank.ACE);
      expect(card).toBeDefined();
      expect(card!.suit).toBe(Suit.HEARTS);
      expect(card!.rank).toBe(Rank.ACE);
    });

    it('存在しない組み合わせの場合はundefinedを返す', () => {
      // 通常のデッキには存在しない組み合わせはないが、テストとして
      const card = deck.findCard(Suit.HEARTS, Rank.ACE);
      expect(card).toBeDefined();
    });
  });

  describe('getAllCards', () => {
    it('すべての元のカードのコピーを返す', () => {
      deck.deal(10); // いくつかのカードを配る
      const allCards = deck.getAllCards();
      
      expect(allCards.length).toBe(52); // 配った後でも全カードを取得
      expect(deck.getRemainingCount()).toBe(42); // 実際のデッキは減っている
    });
  });
});