import { getCardImagePath, preloadCardImages, preloadSingleCardImage } from '../cardImages';

// global.Image のモック
interface MockImage {
  onload: (() => void) | null;
  onerror: ((error: Error) => void) | null;
  src: string;
}

let mockImageInstances: MockImage[] = [];

const createMockImage = (): MockImage => {
  const mockImage: MockImage = {
    onload: null,
    onerror: null,
    src: '',
  };
  mockImageInstances.push(mockImage);
  return mockImage;
};

Object.defineProperty(global, 'Image', {
  value: jest.fn(() => createMockImage()),
});

describe('cardImages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Image mock をリセット
    mockImageInstances = [];
  });

  describe('getCardImagePath', () => {
    it('正しいカード画像パスを生成する', () => {
      expect(getCardImagePath('HEARTS', 'ACE')).toBe('/cards/heart_A.svg');
      expect(getCardImagePath('DIAMONDS', 'KING')).toBe('/cards/diamond_K.svg');
      expect(getCardImagePath('CLUBS', 'TWO')).toBe('/cards/club_2.svg');
      expect(getCardImagePath('SPADES', 'QUEEN')).toBe('/cards/spade_Q.svg');
    });

    it('数字カードの画像パスを正しく生成する', () => {
      expect(getCardImagePath('HEARTS', 'TEN')).toBe('/cards/heart_10.svg');
      expect(getCardImagePath('SPADES', 'FIVE')).toBe('/cards/spade_5.svg');
    });

    it('無効なスートでエラーをスローする', () => {
      expect(() => getCardImagePath('INVALID', 'ACE')).toThrow('Invalid card: INVALID ACE');
    });

    it('無効なランクでエラーをスローする', () => {
      expect(() => getCardImagePath('HEARTS', 'INVALID')).toThrow('Invalid card: HEARTS INVALID');
    });
  });

  describe('preloadSingleCardImage', () => {
    it('画像読み込み成功時にresolveする', async () => {
      const promise = preloadSingleCardImage('HEARTS', 'ACE');
      
      // 最新のmockImageインスタンスを取得
      const mockImage = mockImageInstances[mockImageInstances.length - 1];
      
      // onload を呼び出してPromiseをresolveする
      setTimeout(() => {
        if (mockImage && mockImage.onload) {
          mockImage.onload();
        }
      }, 0);
      
      await expect(promise).resolves.toBeUndefined();
      expect(mockImage.src).toBe('/cards/heart_A.svg');
    });

    it('画像読み込み失敗時にrejectする', async () => {
      const promise = preloadSingleCardImage('HEARTS', 'ACE');
      
      // 最新のmockImageインスタンスを取得
      const mockImage = mockImageInstances[mockImageInstances.length - 1];
      
      // onerror を呼び出してPromiseをrejectする
      setTimeout(() => {
        if (mockImage && mockImage.onerror) {
          mockImage.onerror(new Error('Load failed'));
        }
      }, 0);
      
      await expect(promise).rejects.toThrow('Failed to load image: HEARTS ACE');
    });
  });

  describe('preloadCardImages', () => {
    it('全ての画像が正常に読み込まれる', async () => {
      const promise = preloadCardImages();
      
      // 全ての画像読み込みを成功させる
      setTimeout(() => {
        mockImageInstances.forEach(mockImage => {
          if (mockImage && mockImage.onload) {
            mockImage.onload();
          }
        });
      }, 0);
      
      await expect(promise).resolves.toBeDefined();
    });

    it('一つでも画像読み込みが失敗するとrejectする', async () => {
      const promise = preloadCardImages();
      
      // 最初の画像読み込みを失敗させる
      setTimeout(() => {
        const firstMockImage = mockImageInstances[0];
        if (firstMockImage && firstMockImage.onerror) {
          firstMockImage.onerror(new Error('Load failed'));
        }
      }, 0);
      
      await expect(promise).rejects.toThrow();
    });
  });
});