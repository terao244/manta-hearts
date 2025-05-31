# モック戦略ガイドライン

このドキュメントでは、Mantaプロジェクトにおける型安全なモック戦略について説明します。

## 問題の背景

従来のJestモック戦略では、以下の問題が発生していました：

1. **privateプロパティの問題**: TypeScriptのprivateプロパティを持つクラスのモック化が困難
2. **コンストラクタ依存の問題**: `new ClassName()`で直接インスタンス化されたオブジェクトのモック化が困難
3. **型安全性の欠如**: モックメソッドの型が実際のメソッドと一致しない

## 解決策: 依存性注入 + インターフェース分離パターン

### 1. インターフェースの定義

```typescript
// repositories/interfaces/IPlayerRepository.ts
export interface IPlayerRepository {
  findAll(activeOnly?: boolean): Promise<PlayerData[]>;
  findById(id: number): Promise<PlayerData | null>;
  // ... 他のメソッド
}
```

### 2. DIコンテナの実装

```typescript
// container/Container.ts
class Container {
  private static instance: Container;
  private playerRepository: IPlayerRepository | null = null;

  getPlayerRepository(): IPlayerRepository {
    if (!this.playerRepository) {
      this.playerRepository = new PlayerRepository();
    }
    return this.playerRepository;
  }

  // テスト用にモックを注入
  setPlayerRepository(repository: IPlayerRepository): void {
    this.playerRepository = repository;
  }

  reset(): void {
    this.playerRepository = null;
  }
}
```

### 3. 型安全なモックヘルパー

```typescript
// __tests__/helpers/mockHelpers.ts
export class MockPlayerRepository implements IPlayerRepository {
  findAll = jest.fn<Promise<PlayerData[]>, [boolean?]>();
  findById = jest.fn<Promise<PlayerData | null>, [number]>();
  // ... 他のメソッド
}

export const createMockPlayerRepository = (): MockPlayerRepository => {
  return new MockPlayerRepository();
};
```

### 4. テストでの使用方法

```typescript
// __tests__/routes/players.test.ts
describe('Players API', () => {
  let mockPlayerRepository: MockPlayerRepository;
  let container: Container;

  beforeEach(() => {
    container = Container.getInstance();
    mockPlayerRepository = createMockPlayerRepository();
    container.setPlayerRepository(mockPlayerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    container.reset();
  });

  it('should return all active players', async () => {
    mockPlayerRepository.findAll.mockResolvedValue(mockPlayers);
    // テスト実行...
  });
});
```

## メリット

1. **型安全性**: インターフェースによりモックメソッドの型が保証される
2. **テスト分離**: 各テストでクリーンなモック状態を使用
3. **保守性**: インターフェース変更時にモックも自動的に更新が必要になる
4. **可読性**: モックの作成・設定が明確

## 新しいRepositoryクラスの追加手順

1. インターフェースを定義 (`repositories/interfaces/IXxxRepository.ts`)
2. Repositoryクラスにインターフェースを実装
3. Containerにゲッター/セッターを追加
4. モックヘルパーを作成 (`__tests__/helpers/mockHelpers.ts`)
5. ルート/サービスでContainerを使用

## 注意事項

- 各テスト後に必ず`container.reset()`を呼び出す
- モックメソッドには適切な型引数を指定する
- インターフェース変更時はモックヘルパーも更新する