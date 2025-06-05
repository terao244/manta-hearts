# フロントエンド単体テストエラー分析レポート

## 概要
フロントエンドの単体テストで6つのテストが失敗しています。主な原因は、Jest環境でfetch APIが利用できないことです。

## エラー詳細

### 失敗しているテストファイル
1. `src/app/history/[gameId]/__tests__/page.test.tsx` - 6テスト失敗
2. `src/hooks/__tests__/useGameHistory.test.ts` - 一部のテストでエラーログ出力

### 根本原因
```
ReferenceError: fetch is not defined
```

Jest環境（Node.js）ではブラウザのfetch APIが存在しないため、APIコールを含むコンポーネントやフックのテストが失敗しています。

## 詳細分析

### 1. 影響を受けているコンポーネント/フック
- `useGameDetail` フック (src/hooks/useGameDetail.ts)
- `GameDetailPage` コンポーネント (src/app/history/[gameId]/page.tsx)
- API関数 (src/lib/api/games.ts)

### 2. 問題の流れ
1. `GameDetailPage`コンポーネントが`useGameDetail`フックを使用
2. `useGameDetail`が`fetchGameByIdWithRetry`を呼び出し
3. `fetchGameByIdWithRetry`内でfetchを使用（31行目）
4. Node.js環境でfetchが定義されていないためエラー発生
5. エラーによりローディング状態のまま停止
6. テストが期待する要素を見つけられず失敗

### 3. 現在のテスト環境設定
```javascript
// jest.config.js
const customJestConfig = {
  testEnvironment: 'jsdom',
  // ...
};
```

jsdom環境にはfetch APIが含まれていません。

## 解決案

### 案1: fetch APIのポリフィルを追加（推奨）
`jest.setup.js`にfetchのポリフィルを追加します。

```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// fetch APIのポリフィル
global.fetch = jest.fn();

// または、実際のfetch実装を使用
import 'whatwg-fetch';

// または、node-fetchを使用
import fetch from 'node-fetch';
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
global.Headers = fetch.Headers;
```

### 案2: APIコールをモック化
テストファイルで`useGameDetail`フックをモックします。

```javascript
// src/app/history/[gameId]/__tests__/page.test.tsx
jest.mock('../../../hooks/useGameDetail', () => ({
  useGameDetail: jest.fn(() => ({
    game: mockGameData,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));
```

### 案3: MSW（Mock Service Worker）の導入
より高度なAPIモッキングソリューションとして、MSWを使用します。

```javascript
// jest.setup.js
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 推奨アプローチ

### 短期的解決策（即座に実装可能）
**案2のモック化**を採用し、テストファイルで必要なフックをモックする。

### 長期的解決策（プロジェクト全体の品質向上）
**案1のポリフィル追加**または**案3のMSW導入**を採用し、より現実的なテスト環境を構築する。

## 実装例

### 案2の実装例（即座に対応可能）

```javascript
// src/app/history/[gameId]/__tests__/page.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useParams, usePathname } from 'next/navigation';
import GameDetailPage from '../page';
import { useGameDetail } from '../../../hooks/useGameDetail';

// フックをモック
jest.mock('../../../hooks/useGameDetail');
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  usePathname: jest.fn(),
}));

const mockUseGameDetail = useGameDetail as jest.MockedFunction<typeof useGameDetail>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('GameDetailPage', () => {
  const mockGameData = {
    id: 123,
    startTime: '2025-06-03T10:00:00Z',
    endTime: '2025-06-03T11:30:00Z',
    duration: 90,
    status: 'FINISHED',
    players: [
      { id: 1, name: 'Player 1', position: 'North', finalScore: 45 },
      { id: 2, name: 'Player 2', position: 'East', finalScore: 67 },
      { id: 3, name: 'Player 3', position: 'South', finalScore: 23 },
      { id: 4, name: 'Player 4', position: 'West', finalScore: 89 },
    ],
    scoreHistory: [],
    hands: [],
  };

  beforeEach(() => {
    mockUseParams.mockReturnValue({ gameId: '123' });
    mockUsePathname.mockReturnValue('/history/123');
    mockUseGameDetail.mockReturnValue({
      game: mockGameData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders game detail page title with correct game ID', () => {
    render(<GameDetailPage />);
    
    expect(screen.getByText('ゲーム #123')).toBeInTheDocument();
    // 他のアサーションも同様に調整
  });
});
```

## 結論

現在のテストエラーは、テスト環境の設定不足によるものです。実装自体に問題はないため、テスト環境を修正することで解決できます。

推奨される対応：
1. **即座の対応**: 各テストファイルでAPIフックをモック化
2. **恒久的対応**: jest.setup.jsにfetchポリフィルを追加、またはMSWを導入

どちらのアプローチを採用するかは、プロジェクトの規模とテスト戦略によって決定してください。