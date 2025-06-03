# Manta ハーツゲーム アーキテクチャ説明書

## 1. システム概要

Mantaは、4人のプレイヤーがリアルタイムで対戦するハーツカードゲーム（トリックテイキングゲーム）のWebアプリケーションです。本システムは、フロントエンド/バックエンド分離型のモノレポ構成で実装されており、WebSocketを利用したリアルタイム通信により、スムーズなゲーム体験を提供します。

### 1.1 システム構成図

```
┌────────────────────┐     WebSocket      ┌────────────────────┐     Prisma ORM    ┌────────────────────┐
│   Next.js 14+      │ ←──────────────────→│   Express.js       │ ←────────────────→│   PostgreSQL       │
│   Frontend         │     (Socket.io)      │   Backend          │                   │   Database         │
│   (TypeScript)     │                      │   (TypeScript)     │                   │   (JSONB)          │
└────────────────────┘                      └────────────────────┘                   └────────────────────┘
        ↓                                            ↓                                         ↓
   - React App Router                        - Game Engine                              - Game History
   - Tailwind CSS                            - Session Management                      - Player Statistics  
   - Chart.js                                - Repository Pattern                      - Card Master Data
```

### 1.2 技術スタック

#### フロントエンド
- **Next.js 14+** (App Router): Reactベースのフレームワーク
- **TypeScript**: 型安全性の確保
- **Tailwind CSS**: ユーティリティファーストCSSフレームワーク
- **Socket.io-client**: リアルタイム通信クライアント
- **Chart.js + react-chartjs-2**: スコア推移グラフ表示

#### バックエンド
- **Node.js + Express.js**: Webサーバーフレームワーク
- **TypeScript**: 型安全性の確保
- **Socket.io**: WebSocketベースのリアルタイム通信
- **Prisma ORM**: 型安全なデータベースアクセス

#### データベース
- **PostgreSQL 15**: JSONB型を活用したゲームデータ保存
- **Prisma Schema**: データモデル定義とマイグレーション管理

#### 開発環境
- **Docker Compose**: 開発環境の構築と管理
- **Jest**: 単体テスト（フロントエンド30テスト、バックエンド168テスト）
- **ESLint + Prettier**: コード品質管理

## 2. アーキテクチャ設計原則

### 2.1 レイヤードアーキテクチャ

本システムは、以下の層構造を採用しています：

1. **プレゼンテーション層** (Frontend)
   - React Componentsによる UI 実装
   - Custom Hooksによる状態管理とビジネスロジック
   - Socket.ioクライアントによるリアルタイム通信

2. **アプリケーション層** (Backend - Socket/Routes)
   - Socket.ioハンドラーによるイベント処理
   - Express.jsルーターによるREST API

3. **ドメイン層** (Backend - Game/Services)
   - GameEngineによるゲームロジック実装
   - ドメインモデル（Card、Player、GameState等）

4. **インフラストラクチャ層** (Backend - Repository/Prisma)
   - Repositoryパターンによるデータアクセス抽象化
   - PrismaServiceによるDB接続管理

### 2.2 設計パターン

#### シングルトンパターン
- `GameService`: ゲーム管理のシングルトンインスタンス
- `PrismaService`: データベース接続のシングルトン管理
- `Container`: 依存性注入コンテナ

#### Repositoryパターン
- `PlayerRepository`: プレイヤーデータアクセスの抽象化
- インターフェース分離によるテスタビリティの向上

#### イベント駆動アーキテクチャ
- GameEngineEventシステムによる疎結合設計
- Socket.ioイベントによるクライアント・サーバー間通信

#### 依存性注入（DI）
- Containerクラスによるサービスの管理
- テスト時のモック注入サポート

## 3. バックエンドアーキテクチャ詳細

### 3.1 ディレクトリ構造

```
backend/
├── src/
│   ├── server.ts              # アプリケーションエントリーポイント
│   ├── container/             # 依存性注入コンテナ
│   │   └── Container.ts
│   ├── game/                  # ゲームドメインロジック
│   │   ├── Card.ts           # カードモデル
│   │   ├── Deck.ts           # デッキ管理
│   │   ├── GameEngine.ts     # ゲーム制御エンジン
│   │   ├── GameState.ts      # ゲーム状態管理
│   │   └── Player.ts         # プレイヤーモデル
│   ├── middleware/            # Express ミドルウェア
│   │   └── errorHandler.ts
│   ├── repositories/          # データアクセス層
│   │   ├── PlayerRepository.ts
│   │   └── interfaces/
│   │       └── IPlayerRepository.ts
│   ├── routes/                # REST API ルート
│   │   └── players.ts
│   ├── services/              # ビジネスロジックサービス
│   │   ├── GameService.ts    # ゲーム管理サービス
│   │   └── PrismaService.ts  # DB接続サービス
│   ├── socket/                # Socket.io ハンドラー
│   │   └── handlers.ts
│   └── types/                 # TypeScript型定義
│       └── index.ts
├── prisma/
│   ├── schema.prisma          # データベーススキーマ
│   ├── seed.ts                # シードデータ
│   └── migrations/            # マイグレーションファイル
└── __tests__/                 # テストファイル
```

### 3.2 コアコンポーネント

#### GameEngine
ゲームの中核となるロジックを管理：
- カード配布とシャッフル
- カード交換処理
- トリック判定とスコア計算
- ハートブレイク判定
- シュートザムーン判定
- ゲーム進行状態管理

```typescript
export interface GameEngineEvents {
  onGameStateChanged: (gameState: GameState) => void;
  onPlayerJoined: (playerId: number) => void;
  onCardPlayed: (playerId: number, card: Card) => void;
  onTrickCompleted: (trickNumber: number, winnerId: number, points: number) => void;
  onHandCompleted: (handNumber: number, scores: Map<number, number>) => void;
  onGameCompleted: (winnerId: number, finalScores: Map<number, number>) => void;
}
```

#### GameService
ゲームセッション管理とSocket.io統合：
- 複数ゲームの同時管理
- プレイヤーのゲーム参加・離脱処理
- ゲーム状態の永続化
- Socket.ioイベントの配信

#### PrismaService
データベース接続の一元管理：
- シングルトンパターンによる接続管理
- ヘルスチェック機能
- 開発環境でのクエリログ出力

### 3.3 通信プロトコル

#### Socket.ioイベント（Client → Server）
- `login`: プレイヤーログイン
- `joinGame`: ゲーム参加
- `playCard`: カードプレイ
- `exchangeCards`: カード交換
- `getValidCards`: 有効カード取得

#### Socket.ioイベント（Server → Client）
- `gameStateChanged`: ゲーム状態更新
- `playerJoined/Left`: プレイヤー参加/離脱通知
- `cardsDealt`: カード配布通知
- `cardPlayed`: カードプレイ通知
- `trickCompleted`: トリック完了通知
- `handCompleted`: ハンド完了通知
- `gameCompleted`: ゲーム完了通知

## 4. フロントエンドアーキテクチャ詳細

### 4.1 ディレクトリ構造

```
frontend/src/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # ホーム（ログイン/ゲーム画面）
│   └── globals.css          # グローバルスタイル
├── components/              # Reactコンポーネント
│   ├── game/               # ゲーム関連コンポーネント
│   │   ├── GameBoard.tsx   # ゲームボード全体
│   │   ├── Card.tsx        # カードコンポーネント
│   │   ├── Hand.tsx        # 手札表示
│   │   └── ScoreGraph.tsx  # スコアグラフ
│   └── ui/                 # UI共通コンポーネント
│       ├── PlayerSelect.tsx # プレイヤー選択
│       ├── GameLobby.tsx   # ゲームロビー
│       └── ConnectionStatus.tsx # 接続状態表示
├── hooks/                   # カスタムフック
│   ├── useSocket.ts        # Socket.io管理
│   ├── useGame.ts          # ゲーム状態管理
│   └── useCardImages.ts    # カード画像管理
├── types/                   # TypeScript型定義
│   └── index.ts
└── utils/                   # ユーティリティ関数
    └── cardImages.ts
```

### 4.2 状態管理アーキテクチャ

#### カスタムフックによる状態管理
1. **useSocket**: Socket.io接続とイベント管理
   - 接続状態の管理
   - 自動再接続処理
   - イベントリスナーの登録/解除

2. **useGame**: ゲーム状態とロジック管理
   - ゲーム状態の保持と更新
   - Socket.ioイベントのハンドリング
   - ゲームアクション（カードプレイ、交換等）

3. **useCardImages**: カード画像の動的インポート
   - 遅延ロードによるパフォーマンス最適化
   - エラーハンドリング

#### コンポーネント階層と責務

```
<Home> (ページコンポーネント)
  ├── <ConnectionStatus> (接続状態表示)
  └── <GameBoard> (ゲーム画面)
      ├── <PlayerCard> × 4 (プレイヤー情報)
      ├── <Card> × n (トリックカード表示)
      ├── <Hand> (手札管理)
      │   └── <Card> × 13 (手札カード)
      └── <ScoreGraph> (スコア推移)
```

### 4.3 リアルタイム同期メカニズム

1. **初期接続フロー**
   ```
   ユーザー → PlayerSelect → login → joinGame → gameState受信
   ```

2. **ゲーム中の状態同期**
   - Socket.ioイベントによる即座の状態更新
   - 楽観的UIによるレスポンシブな操作感
   - エラー時のロールバック処理

3. **再接続処理**
   - LocalStorageを使用したセッション保持
   - 自動再接続とゲーム状態の復元
   - 30秒のタイムアウト設定

## 5. データベース設計

### 5.1 スキーマ設計思想

#### 正規化とJSONB活用のハイブリッド設計
- **正規化**: プレイヤー、ゲーム、カードなどのマスターデータ
- **JSONB型**: トリック詳細、スコア履歴などの複雑なデータ

#### 主要テーブル構造

1. **players**: プレイヤーマスター（4名固定）
2. **cards**: カードマスター（52枚）
3. **games**: ゲームセッション管理
4. **hands**: ハンド（ラウンド）情報
5. **hand_cards**: 初期配布カード
6. **card_exchanges**: カード交換履歴
7. **tricks**: トリック情報
8. **trick_cards**: トリックで出されたカード
9. **hand_scores**: ハンドごとのスコア
10. **game_sessions**: プレイヤー接続状態
11. **player_statistics**: プレイヤー統計
12. **monthly_statistics**: 月次集計

### 5.2 パフォーマンス考慮事項

#### インデックス設計
- ゲーム検索用: `games.start_time`
- プレイヤー検索用: `players.name`
- 統計検索用: `player_statistics.win_rate`

#### クエリ最適化
- Prismaの`select`と`include`による必要データのみ取得
- トランザクション処理によるデータ整合性確保
- JSONB型によるNoSQL的な柔軟なデータ保存

## 6. セキュリティとエラーハンドリング

### 6.1 セキュリティ対策

#### 最小限のセキュリティ実装（プライベート環境前提）
- CORS設定による適切なオリジン制限
- Prismaによる自動的なSQLインジェクション対策
- 環境変数による機密情報の分離
- WebSocket接続の認証（プレイヤーID検証）

### 6.2 エラーハンドリング戦略

#### バックエンド
- Express エラーハンドリングミドルウェア
- try-catchによる非同期エラーのキャッチ
- GameEngineイベントシステムでのエラー伝播
- データベースエラーの適切な処理

#### フロントエンド
- Socket.io接続エラーの表示
- ゲームアクションエラーのユーザーフィードバック
- 楽観的更新の失敗時ロールバック

## 7. パフォーマンスと最適化

### 7.1 フロントエンド最適化

#### Next.js自動最適化
- 自動コード分割
- 画像最適化（next/image）
- プリフェッチとプリロード

#### カスタム最適化
- カード画像の遅延ロード
- React.memoによる不要な再レンダリング防止
- Chart.jsアニメーションの無効化

### 7.2 バックエンド最適化

#### メモリ管理
- ゲーム状態のメモリ内キャッシュ
- 完了ゲームの適切なクリーンアップ
- Socket.io接続の効率的な管理

#### データベース最適化
- 適切なインデックス設計
- JSONB型による柔軟なデータ構造
- バッチ処理とトランザクション最適化

### 7.3 リアルタイム通信最適化

#### Socket.io設定
- WebSocketトランスポート優先
- 適切なハートビート間隔（25秒）
- ルーム機能による効率的なイベント配信

## 8. テスト戦略

### 8.1 テストカバレッジ

#### バックエンド（168テスト）
- **単体テスト**: ゲームロジック、モデル、サービス
- **統合テスト**: API エンドポイント、Socket.io ハンドラー
- **モック戦略**: PrismaService、Repository のモック実装

#### フロントエンド（30テスト）
- **コンポーネントテスト**: React Testing Library
- **フックテスト**: renderHook によるカスタムフックテスト
- **モック**: Socket.io クライアントのモック

### 8.2 テスト環境

#### Jest設定
- TypeScript サポート
- カバレッジレポート
- 並列実行による高速化

#### モックヘルパー
- `mockHelpers.ts`: 共通モック関数
- 型安全なモック実装
- テストデータ生成ユーティリティ

## 9. デプロイメントアーキテクチャ

### 9.1 Docker Compose構成

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: hearts_game
      POSTGRES_USER: hearts_user
      POSTGRES_PASSWORD: hearts_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hearts_user -d hearts_game"]

  backend:
    build: ./backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://hearts_user:hearts_password@db:5432/hearts_game
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_BACKEND_URL: http://localhost:3001
    volumes:
      - ./frontend:/app
```

### 9.2 環境変数管理

#### バックエンド
- `DATABASE_URL`: PostgreSQL接続文字列
- `PORT`: サーバーポート（デフォルト: 3001）
- `NODE_ENV`: 実行環境
- `FRONTEND_URL`: CORS許可オリジン
- `GAME_END_SCORE`: ゲーム終了スコア（デフォルト: 100）

#### フロントエンド
- `NEXT_PUBLIC_BACKEND_URL`: バックエンドURL

## 10. 今後の拡張性

### 10.1 アーキテクチャの拡張ポイント

1. **マルチルーム対応**
   - GameServiceの拡張による複数ゲームルーム管理
   - ルーム作成・参加機能の追加

2. **AI プレイヤー実装**
   - Strategyパターンによるプレイヤー種別の抽象化
   - AIロジックのプラグイン化

3. **統計・分析機能強化**
   - リアルタイムダッシュボード
   - 詳細な戦績分析

4. **モバイル対応**
   - レスポンシブデザインの実装
   - タッチ操作の最適化

### 10.2 技術的改善案

1. **マイクロサービス化**
   - ゲームロジックサービスの分離
   - 統計サービスの独立化

2. **GraphQL導入**
   - より効率的なデータフェッチング
   - リアルタイムサブスクリプション

3. **Redis導入**
   - セッション管理の高速化
   - ゲーム状態のキャッシング

## 11. まとめ

Mantaは、モダンなWeb技術スタックを活用した、拡張性と保守性に優れたハーツゲームアプリケーションです。レイヤードアーキテクチャと適切なデザインパターンの採用により、各コンポーネントの責務が明確に分離され、テスタブルで変更に強い設計となっています。

TypeScriptによるエンドツーエンドの型安全性、Socket.ioによるリアルタイム通信、Prisma ORMによる型安全なデータアクセスなど、開発効率と品質を両立する技術選定により、高品質なゲーム体験を提供しています。