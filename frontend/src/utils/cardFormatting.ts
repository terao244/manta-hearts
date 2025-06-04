/**
 * カード表記システム - スーツ記号と数字の統一表記
 */

import { CardInfo, CardDisplay } from '../types';

// スーツの表記マッピング
const SUIT_SYMBOLS: Record<string, { symbol: string; color: 'red' | 'black' }> = {
  'SPADES': { symbol: '♠', color: 'black' },
  'HEARTS': { symbol: '♥', color: 'red' },
  'CLUBS': { symbol: '♣', color: 'black' },
  'DIAMONDS': { symbol: '♦', color: 'red' },
};

// ランクの表記マッピング
const RANK_DISPLAY: Record<string, string> = {
  'TWO': '2',
  'THREE': '3',
  'FOUR': '4',
  'FIVE': '5',
  'SIX': '6',
  'SEVEN': '7',
  'EIGHT': '8',
  'NINE': '9',
  'TEN': '10',
  'JACK': 'J',
  'QUEEN': 'Q',
  'KING': 'K',
  'ACE': 'A',
};

/**
 * カード情報を統一表記フォーマットに変換
 * @param suit カードのスーツ（SPADES, HEARTS, CLUBS, DIAMONDS）
 * @param rank カードのランク（TWO-ACE）
 * @returns カード表示情報
 */
export function formatCard(suit: string, rank: string): CardDisplay {
  const suitInfo = SUIT_SYMBOLS[suit.toUpperCase()];
  const rankDisplay = RANK_DISPLAY[rank.toUpperCase()];

  if (!suitInfo || !rankDisplay) {
    throw new Error(`Invalid card: ${suit} ${rank}`);
  }

  return {
    suit: suit.toUpperCase(),
    rank: rank.toUpperCase(),
    displayText: `${suitInfo.symbol}${rankDisplay}`,
    color: suitInfo.color,
  };
}

/**
 * CardInfo型からカード表記を生成
 * @param card CardInfo型のカード情報
 * @returns カード表示情報
 */
export function formatCardFromInfo(card: CardInfo): CardDisplay {
  return formatCard(card.suit, card.rank);
}

/**
 * CardInfo配列を表記フォーマットに変換
 * @param cards CardInfo配列
 * @returns カード表示情報配列
 */
export function formatCardsFromInfo(cards: CardInfo[]): CardDisplay[] {
  return cards.map(card => formatCardFromInfo(card));
}

/**
 * カード配列を表記フォーマットに変換
 * @param cards カード配列
 * @returns カード表示情報配列
 */
export function formatCards(cards: Array<{ suit: string; rank: string }>): CardDisplay[] {
  return cards.map(card => formatCard(card.suit, card.rank));
}

/**
 * カード表記用のCSSクラス名を生成
 * @param color カードの色（red/black）
 * @returns Tailwind CSSクラス名
 */
export function getCardColorClass(color: 'red' | 'black'): string {
  return color === 'red' ? 'text-red-600' : 'text-gray-900';
}

/**
 * CardInfo型からカード表記を短縮形で表示
 * @param card CardInfo型のカード情報
 * @returns 短縮表記（例: "♠A", "♥K"）
 */
export function formatCardShortFromInfo(card: CardInfo): string {
  const formatted = formatCardFromInfo(card);
  return formatted.displayText;
}

/**
 * カード表記を短縮形で表示（テーブル等の狭いスペース用）
 * @param suit カードのスーツ
 * @param rank カードのランク
 * @returns 短縮表記（例: "♠A", "♥K"）
 */
export function formatCardShort(suit: string, rank: string): string {
  const formatted = formatCard(suit, rank);
  return formatted.displayText;
}

/**
 * CardInfo配列の表記をコンパクトに表示
 * @param cards CardInfo配列
 * @param separator セパレーター文字（デフォルト: " "）
 * @returns 複数カード表記文字列
 */
export function formatCardsCompactFromInfo(
  cards: CardInfo[], 
  separator: string = ' '
): string {
  return cards.map(card => formatCardShortFromInfo(card)).join(separator);
}

/**
 * 複数カードの表記をコンパクトに表示
 * @param cards カード配列
 * @param separator セパレーター文字（デフォルト: " "）
 * @returns 複数カード表記文字列
 */
export function formatCardsCompact(
  cards: Array<{ suit: string; rank: string }>, 
  separator: string = ' '
): string {
  return cards.map(card => formatCardShort(card.suit, card.rank)).join(separator);
}

/**
 * カードのポイント値を取得（ハーツゲーム用）
 * @param suit カードのスーツ
 * @param rank カードのランク
 * @returns ポイント値
 */
export function getCardPoints(suit: string, rank: string): number {
  if (suit.toUpperCase() === 'HEARTS') {
    return 1;
  }
  if (suit.toUpperCase() === 'SPADES' && rank.toUpperCase() === 'QUEEN') {
    return 13;
  }
  return 0;
}

/**
 * カードの表示順序を取得（ソート用）
 * @param suit カードのスーツ
 * @param rank カードのランク
 * @returns ソート用数値
 */
export function getCardSortOrder(suit: string, rank: string): number {
  const suitOrder = { 'CLUBS': 0, 'DIAMONDS': 1, 'SPADES': 2, 'HEARTS': 3 };
  const rankOrder = { 
    'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 'SIX': 6, 'SEVEN': 7, 
    'EIGHT': 8, 'NINE': 9, 'TEN': 10, 'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14 
  };
  
  const suitValue = suitOrder[suit.toUpperCase() as keyof typeof suitOrder] ?? 0;
  const rankValue = rankOrder[rank.toUpperCase() as keyof typeof rankOrder] ?? 0;
  
  return suitValue * 100 + rankValue;
}