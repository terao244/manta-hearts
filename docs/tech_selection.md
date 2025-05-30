# ハーツゲーム Webアプリケーション 技術選定書

## 1. アーキテクチャ概要

### 1.1 システム構成
```
┌─────────────────┐    WebSocket    ┌─────────────────┐    Prisma    ┌─────────────────┐
│   Next.js       │ ←→ リアルタイム通信 │   Express       │ ←→ ORM      │  PostgreSQL     │
│   フロントエンド  │                │   バックエンド   │             │  データベース    │
│   (TypeScript)  │                │   (TypeScript)  │             │                │
└─────────────────┘                └─────────────────┘             └─────────────────┘
```

### 1.2 設計方針
- **フロントエンド/バックエンド分離**：明確な責任分離
- **型安全性重視**：TypeScript + Prismaによる一貫した型安全性
- **リアルタイム重視**：WebSocketによる即座な同期
- **開発効率最適化**：Next.js + Prismaの開発体験活用

## 2. フロントエンド技術選定

### 2.1 フレームワーク：Next.js 14+

#### 2.1.1 選定理由
- **TypeScript完全統合**：Prismaとの型共有が可能
- **優秀な開発体験**：Hot Reload、自動ルーティング
- **最適化された性能**：自動コード分割、画像最適化
- **App Router**：最新のNext.js機能活用
- **豊富なエコシステム**：Chart.js、Socket.io との統合容易

#### 2.1.2 技術スタック
- **Next.js 14+**：React フレームワーク（App Router使用）
- **TypeScript**：型安全性
- **Tailwind CSS**：ユーティリティファーストCSS
- **Chart.js + react-chartjs-2**：グラフ表示
- **Socket.io-client**：リアルタイム通信

### 2.2 状態管理：React Context + カスタムフック

#### 2.2.1 選定理由
- **Next.js標準機能**：追加ライブラリ不要
- **シンプルな要件**：4人固定ゲームに適合
- **Socket.io統合**：リアルタイム通信との相性良好

#### 2.2.2 実装例
```typescript
// ゲーム状態管理
interface GameContextType {
  gameState: GameState | null;
  socket: Socket | null;
  connectToGame: (playerName: string) => void;
  playCard: (card: Card) => void;
}

export const GameContext = createContext<GameContextType | null>(null);

// カスタムフック
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:3001');
    setSocket(socketInstance);
    return () => socketInstance.close();
  }, []);

  return { socket, connected };
};
```

### 2.3 プロジェクト構成
```
frontend/
├── src/
│   ├── app/                 # App Router
│   │   ├── page.tsx         # ログイン画面
│   │   ├── game/
│   │   │   └── page.tsx     # ゲーム画面
│   │   └── history/
│   │       └── page.tsx     # 履歴画面
│   ├── components/          # コンポーネント
│   │   ├── Game/            # ゲーム関連
│   │   ├── Chart/           # グラフ関連
│   │   └── UI/              # 共通UI
│   ├── hooks/               # カスタムフック
│   ├── types/               # 型定義
│   └── lib/                 # ユーティリティ
├── public/                  # 静的ファイル
├── tailwind.config.js
├── next.config.js
└── package.json
```

## 3. バックエンド技術選定

### 3.1 基本技術スタック

#### 3.1.1 ランタイム：Node.js + TypeScript
- **型安全性**：Prismaとの完全統合
- **開発効率**：フロントエンドとの言語統一
- **非同期処理**：WebSocketとの親和性

#### 3.1.2 Webフレームワーク：Express.js
- **軽量でシンプル**：必要最小限の機能
- **Socket.io統合**：WebSocketサーバーとの統合容易
- **豊富なミドルウェア**：CORS、エラーハンドリング

### 3.2 リアルタイム通信：Socket.io

#### 3.2.1 選定理由
- **WebSocket抽象化**：自動フォールバック機能
- **ルーム機能**：4人ゲームの管理に最適
- **自動再接続**：切断時の復旧機能
- **TypeScript対応**：型安全な通信

#### 3.2.2 設定例
```javascript
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});
```

### 3.3 プロジェクト構成
```
backend/
├── src/
│   ├── server.ts            # メインサーバー
│   ├── routes/              # APIルート
│   ├── socket/              # Socket.io処理
│   ├── game/                # ゲームロジック
│   ├── types/               # 型定義
│   └── utils/               # ユーティリティ
├── prisma/
│   ├── schema.prisma        # データベーススキーマ
│   └── migrations/          # マイグレーション
└── package.json
```

## 4. データベース技術選定

### 4.1 RDBMS：PostgreSQL

#### 4.1.1 選定理由
- **JSONB サポート**：ゲームデータの柔軟な保存
- **高い性能**：複雑なクエリ、大量データ処理
- **ACID特性**：データ整合性保証
- **豊富な機能**：ウィンドウ関数、集計関数
- **Prisma親和性**：完全サポート

### 4.2 ORM：Prisma

#### 4.2.1 選定理由
- **型安全性**：TypeScriptとの完全統合
- **自動マイグレーション**：スキーマ変更の安全な適用
- **直感的なAPI**：可読性の高いクエリ
- **開発体験**：Prisma Studio、自動補完
- **PostgreSQL機能**：JSONB型の完全活用

#### 4.2.2 スキーマ設計
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Game {
  id           Int      @id @default(autoincrement())
  startTime    DateTime @default(now()) @map("start_time")
  endTime      DateTime? @map("end_time")
  status       GameStatus
  finalScores  Json?    @map("final_scores")
  winner       String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  hands        Hand[]
  
  @@map("games")
}

model Hand {
  id                Int      @id @default(autoincrement())
  gameId           Int      @map("game_id")
  handNumber       Int      @map("hand_number")
  initialCards     Json     @map("initial_cards")
  cardExchanges    Json     @map("card_exchanges")
  tricks           Json
  handScores       Json     @map("hand_scores")
  cumulativeScores Json     @map("cumulative_scores")
  createdAt        DateTime @default(now()) @map("created_at")
  
  game             Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  @@unique([gameId, handNumber])
  @@map("hands")
}

model GameStatistics {
  id                      Int      @id @default(autoincrement())
  playerName             String   @unique @map("player_name")
  totalGames             Int      @default(0) @map("total_games")
  wins                   Int      @default(0)
  averageScore           Float?   @map("average_score")
  bestScore              Int?     @map("best_score")
  worstScore             Int?     @map("worst_score")
  totalHeartsTaken       Int      @default(0) @map("total_hearts_taken")
  totalQueenOfSpadesTaken Int     @default(0) @map("total_queen_of_spades_taken")
  shootTheMoonCount      Int      @default(0) @map("shoot_the_moon_count")
  updatedAt              DateTime @updatedAt @map("updated_at")
  
  @@map("game_statistics")
}

enum GameStatus {
  PLAYING
  FINISHED
  PAUSED
}
```

### 4.3 データベース操作例

#### 4.3.1 基本操作
```typescript
// ゲーム開始
async function startNewGame() {
  const game = await prisma.game.create({
    data: { status: 'PLAYING' }
  });
  return game.id;
}

// ハンド保存
async function saveHandData(gameId: number, handData: HandData) {
  await prisma.hand.create({
    data: {
      gameId,
      handNumber: handData.handNumber,
      initialCards: handData.initialCards,
      cardExchanges: handData.cardExchanges,
      tricks: handData.tricks,
      handScores: handData.handScores,
      cumulativeScores: handData.cumulativeScores
    }
  });
}

// ゲーム終了・統計更新
async function finishGame(gameId: number, finalScores: Record<string, number>, winner: string) {
  await prisma.$transaction(async (tx) => {
    // ゲーム更新
    await tx.game.update({
      where: { id: gameId },
      data: {
        endTime: new Date(),
        status: 'FINISHED',
        finalScores,
        winner
      }
    });
    
    // 統計更新
    for (const [playerName, score] of Object.entries(finalScores)) {
      await tx.gameStatistics.upsert({
        where: { playerName },
        update: {
          totalGames: { increment: 1 },
          wins: playerName === winner ? { increment: 1 } : undefined,
          // その他の統計更新...
        },
        create: {
          playerName,
          totalGames: 1,
          wins: playerName === winner ? 1 : 0,
          averageScore: score,
          bestScore: score,
          worstScore: score
        }
      });
    }
  });
}
```

## 5. 開発・運用環境

### 5.1 開発環境：Docker Compose

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: hearts_game
      POSTGRES_USER: hearts_user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://hearts_user:password@db:5432/hearts_game
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
```

### 5.2 パッケージ構成

#### 5.2.1 フロントエンド
```json
{
  "name": "hearts-game-frontend",
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "socket.io-client": "^4.7.0",
    "chart.js": "^4.0.0",
    "react-chartjs-2": "^5.0.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

#### 5.2.2 バックエンド
```json
{
  "name": "hearts-game-backend",
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "express": "^4.18.2",
    "socket.io": "^4.7.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "tsx": "^3.12.0",
    "typescript": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
```

### 5.3 セキュリティ対策（最小限）
- **CORS設定**：適切なオリジン制限
- **HTTPS推奨**：本番環境での暗号化通信
- **プリペアドステートメント**：Prismaによる自動SQL対策
- **環境変数**：機密情報の分離

## 6. パフォーマンス・品質

### 6.1 パフォーマンス目標
- **WebSocket通信**：100ms以内
- **データベースクエリ**：50ms以内
- **ページロード**：2秒以内（Next.js最適化活用）

### 6.2 最適化方針
- **Next.js自動最適化**：コード分割、画像最適化
- **Prismaクエリ最適化**：適切なselect、include
- **Socket.ioルーム管理**：効率的なイベント配信
- **Tailwind CSS**：使用クラスのみバンドル

### 6.3 エラーハンドリング
```typescript
// リアルタイム通信エラー
useEffect(() => {
  socket?.on('connect_error', (error) => {
    console.error('Connection failed:', error);
    // 再接続処理
  });
}, [socket]);

// データベースエラー
try {
  await prisma.game.create(data);
} catch (error) {
  console.error('Database error:', error);
  // エラー処理・再試行
}
```

## 7. 実装優先順位

### 7.1 Phase 1（基盤構築）
1. **プロジェクト構造**：モノレポ構成、Docker環境
2. **バックエンド基盤**：Express + Socket.io + Prisma
3. **フロントエンド基盤**：Next.js + TypeScript
4. **データベース**：PostgreSQL + Prismaスキーマ
5. **基本通信**：Socket.io接続確認

### 7.2 Phase 2（ゲーム機能）
1. **ユーザ選択**：ログイン画面、セッション管理
2. **ゲームロジック**：Next.jsコンポーネント設計
3. **リアルタイム同期**：Socket.io + React状態管理
4. **データ永続化**：Prismaトランザクション処理
5. **切断対応**：自動再接続、状態復元

### 7.3 Phase 3（UI・統計）
1. **グラフ機能**：Chart.js + react-chartjs-2
2. **履歴画面**：Next.js App Router + Tailwind
3. **統計機能**：Prismaクエリ + ダッシュボード
4. **UI/UX改善**：アニメーション、レスポンシブ調整
5. **最適化**：パフォーマンス調整、本番対応

## 8. 技術的リスク・対策

### 8.1 主要リスク
1. **WebSocket接続不安定**
   - 対策：自動再接続、状態復元、React useEffect管理

2. **Next.js SSRとSocket.io競合**
   - 対策：useEffect内Socket初期化、クライアントサイド限定実行

3. **Prismaクエリ複雑化**
   - 対策：適切なリレーション設計、必要に応じてrawクエリ併用

4. **Next.jsビルドサイズ**
   - 対策：動的インポート、Chart.js最適化、不要依存削除

5. **TypeScriptビルドエラー**
   - 対策：段階的導入、適切な型定義、strict設定

### 8.2 技術的制約
- **プライベート環境前提**：セキュリティ要件は最小限
- **4人固定**：スケールアウトには設計変更必要
- **PCブラウザ専用**：モバイル対応は範囲外

## 9. 代替技術との比較

### 9.1 検討したが採用しなかった技術

| 技術 | メリット | デメリット | 採用判定 |
|------|---------|-----------|---------|
| バニラJS | 軽量、シンプル | 開発効率低、型安全性なし | ❌ |
| Create React App | React標準 | メンテナンス終了、最適化不足 | ❌ |
| Vite + React | 高速ビルド | SSR機能なし、設定複雑 | ❌ |
| pg (node-postgres) | 軽量、高性能 | 型安全性なし、手動管理 | ❌ |
| Redux | 状態管理強力 | オーバースペック | ❌ |

### 9.2 将来的な技術変更可能性
- **Vercel デプロイ**：Next.jsの最適化ホスティング
- **tRPC導入**：型安全なAPI通信（フルスタック型安全性）
- **Zustand導入**：より複雑な状態管理が必要な場合
- **Storybook導入**：コンポーネント開発支援

## 10. 結論

### 10.1 技術選定の要約
- **フロントエンド**：Next.js + TypeScript + Tailwind CSS
- **バックエンド**：Express + Socket.io + TypeScript
- **データベース**：PostgreSQL + Prisma ORM
- **開発環境**：Docker Compose + モノレポ構成

### 10.2 採用理由の総括
1. **型安全性**：TypeScript + Prismaによるエンドツーエンド型安全性
2. **開発効率**：Next.js + Prismaの優秀な開発体験
3. **保守性**：明確な責任分離、コンポーネント指向設計
4. **拡張性**：モダンな技術スタックによる将来対応
5. **パフォーマンス**：Next.js自動最適化、PostgreSQL高性能

この技術選定により、要件を満たしつつ、開発効率・保守性・将来性を確保した構成となります。