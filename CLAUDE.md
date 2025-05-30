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
npm install              # 依存関係のインストール
npm run dev             # 開発サーバー起動 (http://localhost:3000)
npm run build           # プロダクションビルド
npm run lint            # ESLint実行
npm run type-check      # TypeScriptの型チェック
npm test               # テスト実行
```

### バックエンド
```bash
cd backend
npm install              # 依存関係のインストール
npm run dev             # 開発サーバー起動 (http://localhost:3001)
npm run build           # TypeScriptビルド
npm run start           # プロダクション実行
npm run lint            # ESLint実行
npm run type-check      # TypeScriptの型チェック
npm test               # テスト実行
npx prisma migrate dev  # データベースマイグレーション
npx prisma generate     # Prismaクライアント生成
npx prisma studio       # Prisma Studio起動
```

### Docker Compose
```bash
docker-compose up -d     # 全サービス起動
docker-compose down      # 全サービス停止
docker-compose logs -f   # ログ表示
```

## アーキテクチャ概要

### ゲームロジック
- **GameEngine**: ゲームの核となるロジック（backend/src/game/）
  - カード配布、交換、トリック処理、スコア計算
  - ハートブレイク、シュートザムーンの判定
- **状態管理**: Socket.ioによるリアルタイム同期
- **永続化**: Prismaを通じてPostgreSQLに保存

### データフロー
1. クライアント → Socket.io → GameEngine → 状態更新
2. 状態更新 → Prisma → PostgreSQL
3. PostgreSQL → Prisma → Socket.io → 全クライアントへブロードキャスト

### 主要なビジネスルール
- 4人固定のプレイヤー（North, East, South, West）
- 13トリック×4ラウンド = 1ゲーム
- ハート = 1点、スペードQ = 13点
- 100点到達で終了、最低得点者が勝利

## 開発ガイドライン

### テスト駆動開発
- 新機能実装前にテストを作成
- テストがパスするよう実装
- リファクタリング時はテスト結果を維持

### Gitコミット
- 各TODO完了時にコミット
- 意味のある単位でコミットメッセージを記述

### セキュリティ
- 環境変数で機密情報を管理（.env.local）
- APIキー等は絶対にコミットしない