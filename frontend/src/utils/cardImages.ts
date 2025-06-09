/**
 * カード画像のパスを生成するユーティリティ関数
 */

export interface CardImageInfo {
  suit: string;
  rank: string;
  imagePath: string;
}

/**
 * スートとランクからカード画像のパスを生成
 */
export const getCardImagePath = (suit: string, rank: string): string => {
  const suitMap: Record<string, string> = {
    'HEARTS': 'heart',
    'DIAMONDS': 'diamond',
    'CLUBS': 'club',
    'SPADES': 'spade'
  };

  const rankMap: Record<string, string> = {
    'ACE': 'A',
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
    'KING': 'K'
  };

  const suitName = suitMap[suit];
  const rankName = rankMap[rank];

  if (!suitName || !rankName) {
    throw new Error(`Invalid card: ${suit} ${rank}`);
  }

  return `/cards_png/${suitName}_${rankName}.png`;
};

/**
 * カード画像のプリロード機能
 */
export const preloadCardImages = (): Promise<void[]> => {
  const suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
  const ranks = ['ACE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'JACK', 'QUEEN', 'KING'];
  
  const imagePromises = suits.flatMap(suit =>
    ranks.map(rank => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${suit} ${rank}`));
        img.src = getCardImagePath(suit, rank);
      });
    })
  );

  return Promise.all(imagePromises);
};

/**
 * 単一カード画像のプリロード
 */
export const preloadSingleCardImage = (suit: string, rank: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${suit} ${rank}`));
    img.src = getCardImagePath(suit, rank);
  });
};