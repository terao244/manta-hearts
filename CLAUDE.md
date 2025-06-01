# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Mantaは4人対戦型のハーツカードゲーム（トリックテイキングゲーム）のWebアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Socket.io-client, Chart.js
- **バックエンド**: Node.js, Express.js, TypeScript, Socket.io, Prisma
- **データベース**: PostgreSQL (JSONB型活用)
- **開発環境**: Docker Compose（モノレポ構成）

## プロジェクト構造

```
manta/
├── frontend/          # Next.jsフロントエンド
│   ├── src/
│   │   ├── app/      # App Router
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── lib/
│   └── package.json
├── backend/          # Express + Socket.ioバックエンド
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── socket/
│   │   ├── game/
│   │   └── types/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
└── docs/            # ドキュメント
```

## 開発コマンド

### フロントエンド
```bash
cd frontend
npm run dev             # 開発サーバー起動 (http://localhost:3000)
npm run build           # プロダクションビルド
npm run lint            # ESLint実行
npm run type-check      # TypeScriptの型チェック
npm test               # テスト実行（30テスト）
npm run test:watch     # テスト監視モード
npm run format         # Prettierでコード整形
npm run format:check   # Prettierでフォーマットチェック
```

### バックエンド
```bash
cd backend
npm run dev             # 開発サーバー起動 (http://localhost:3001)
npm run build           # TypeScriptビルド
npm run start           # プロダクション実行
npm run lint            # ESLint実行
npm run type-check      # TypeScriptの型チェック
npm test               # テスト実行（168テスト）
npm run test:watch     # テスト監視モード
npm run format         # Prettierでコード整形
npm run format:check   # Prettierでフォーマットチェック

# Prisma関連コマンド
npm run prisma:generate  # Prismaクライアント生成
npm run prisma:push     # スキーマをデータベースにプッシュ
npm run prisma:migrate  # マイグレーション実行
npm run prisma:studio   # Prisma Studio起動
npm run prisma:seed     # シードデータ投入
```

### Docker Compose
```bash
docker-compose up -d     # 全サービス起動
docker-compose down      # 全サービス停止
docker-compose logs -f   # ログ表示
```

### テスト実行推奨順序
```bash
# バックエンドテスト（168テスト）
cd backend && npm test

# フロントエンドテスト（30テスト）
cd frontend && npm test

# 型チェック・lint確認
cd backend && npm run type-check && npm run lint
cd frontend && npm run type-check && npm run lint
```

## アーキテクチャ概要

### バックエンドアーキテクチャ
- **レイヤードアーキテクチャ**を採用
  - `server.ts`: Express + Socket.ioサーバーエントリーポイント
  - `routes/`: RESTful APIエンドポイント
  - `services/`: ビジネスロジックとシングルトンサービス（PrismaService）
  - `repositories/`: データアクセス層（Repository パターン）
  - `middleware/`: エラーハンドリング、ロギングなど横断的関心事
  - `types/`: TypeScript型定義（Socket.ioイベント含む）

### データベース層
- **PrismaService**: シングルトンパターンでPrismaClient管理
- **Repository パターン**: データアクセスを抽象化（例：PlayerRepository）
- **型安全性**: Prisma生成型とカスタム型（PlayerData）の組み合わせ

### Socket.io通信
- **型安全な通信**: TypeScriptインターフェース定義
  - `ClientToServerEvents`: クライアント→サーバー
  - `ServerToClientEvents`: サーバー→クライアント
  - `SocketData`: セッションデータ管理
- **イベント処理**: login, joinGame, playCard, exchangeCards

### ゲームロジック
- **GameEngine**: ゲームの核となるロジック（backend/src/game/）
  - カード配布、交換、トリック処理、スコア計算
  - ハートブレイク、シュートザムーンの判定
- **状態管理**: Socket.ioによるリアルタイム同期
- **永続化**: Prismaを通じてPostgreSQLに保存

### データフロー
1. クライアント → Socket.io → GameEngine → 状態更新
2. 状態更新 → Repository → Prisma → PostgreSQL
3. PostgreSQL → Prisma → Repository → Socket.io → 全クライアントへブロードキャスト

### 主要なビジネスルール
- 4人固定のプレイヤー（North, East, South, West）
- 13トリック×4ラウンド = 1ゲーム
- ハート = 1点、スペードQ = 13点
- 100点到達で終了、最低得点者が勝利

## 開発ガイドライン

### テスト駆動開発・品質管理
- **テスト先行**: 新機能実装前にテストを作成、実装完了時は全テストがパス状態を維持
- **モック戦略**: PrismaService、Repository層の型安全なモック、依存性注入パターン活用
- **テスト環境**: NODE_ENV=test時はサーバー自動起動無効、mockHelpers.ts活用
- **コード品質**: Prettier（自動整形）、ESLint、TypeScript厳密型チェック必須
- **Gitコミット**: TODO完了毎にコミット、意味のある単位でメッセージ記述
- **セキュリティ**: 環境変数管理（.env.local）、APIキー等のコミット禁止

## 現在の実装状況

### 完了済みフェーズ
- **Phase 1**: Docker環境、TypeScript設定、Prettier・Jest設定
- **Phase 2**: Prismaスキーマ、シードデータ、カードマスターデータ
- **Phase 3**: Express + Socket.io、REST API（Players）、Repository層、テスト
- **Phase 4**: ゲームロジック（Card、Deck、Player、GameState、GameEngine）
- **Phase 5**: Socket.io通信層（GameServiceとSocket.ioハンドラー統合）
- **Phase 6**: バックエンドサービス層（ゲーム永続化、依存性注入パターン）
- **Phase 7**: フロントエンドゲーム画面（ゲームボード、カード操作UI）
- **Phase 7.1**: 通信問題修正（Socket.io複数接続問題解決）
- **Phase 7.2**: UI表示問題修正（Reactコンポーネントkey警告エラー解決）
- **Phase 8**: ゲーム画面実装（東西南北配置、手札表示改善、リアルタイム同期）
- **Phase 9**: カード操作UI詳細（主要機能完了：有効カードハイライト、ホバー効果、選択UI改善）

### 実装済みAPI
- `GET /health`: ヘルスチェック
- `GET /api/info`: API情報
- `GET /api/players`: 全プレイヤー一覧
- `GET /api/players/:id`: 特定プレイヤー情報

### ゲームロジック実装済み
- **Card、Suit、Rank**: カード表現とゲームルール
- **Deck**: デッキ管理（シャッフル、配布）
- **Player、GamePlayer**: プレイヤー管理とゲーム状態
- **GameState**: ゲーム状態管理（フェーズ、トリック、スコア）
- **GameEngine**: ゲーム制御（カード配布、交換、プレイ、スコア計算）
- **テスト**: 166個のユニットテスト（全て合格）

### Socket.ioイベント（実装済み）
- `login`: プレイヤーログイン
- `joinGame`: ゲーム参加
- `playCard`: カードプレイ
- `exchangeCards`: カード交換
- `getValidCards`: 有効カード取得（Phase 9で追加）
- `gameState`: ゲーム状態更新
- `playerJoined`: プレイヤー参加通知
- `ping`/`pong`: ハートビート機能

### フロントエンド実装済み
- **React App Router**: Next.js 14 App Router構成
- **Socket.ioクライアント**: 型安全な通信
- **ゲーム画面**: GameBoard（東西南北配置）、Hand（改善済み）、Cardコンポーネント
- **プレイヤー選択**: 4名固定プレイヤー選択UI
- **ゲームロビー**: ゲーム参加・待機機能
- **リアルタイム同期**: Socket.ioによる状態管理
- **手札配布**: 4人揃った時の自動配布とリアルタイム表示
- **カード操作UI**: 有効カードハイライト、ホバー効果、選択UI改善（Phase 9）

### 現在動作可能な機能
- http://localhost:3000 でプレイヤー選択画面表示
- Socket.io接続状態のリアルタイム表示
- 4名固定プレイヤーでのログイン機能
- ゲームロビー画面（ゲーム参加機能）
- ゲームボード画面（東西南北配置、手札表示、プレイヤー情報、スコア表示）
- カードコンポーネント（スート、ランク、ポイント表示、ホバー効果、ツールチップ）
- 手札コンポーネント（直感的ソート、カード選択、交換機能、情報表示、プログレス表示）
- 有効カードハイライト機能（リアルタイム判定、視覚的フィードバック）
- 複数プレイヤー参加時のリアルタイム同期
- 4人揃った時の自動手札配布

### 完了済み実装（2025/06/01最新）
- **手札ソート順変更**: クラブ→ダイヤ→スペード→ハートに変更済み
- **現在ハンド点数表示**: プレイヤーエリアでの現在ハンド累積点数表示実装済み
- **ゲーム終了点数設定**: 環境変数GAME_END_SCOREで30点設定可能
- **ゲーム復帰機能**: ブラウザ再起動時の進行中ゲーム復帰機能実装済み
- **全テスト正常通過**: バックエンド168テスト、フロントエンド30テスト

### 開発中機能（Phase 11以降）
- **データ永続化詳細**: ゲーム保存処理、統計機能
- **UI/UX改善**: カード回収ウェイト、アニメーション強化