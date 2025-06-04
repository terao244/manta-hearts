# Manta 🃏

**4人対戦型リアルタイムハーツカードゲーム**

Mantaは、Webブラウザでプレイできる本格的な4人対戦ハーツカードゲーム（トリックテイキングゲーム）です。リアルタイム通信により、離れた場所にいる友人と一緒にカードゲームを楽しむことができます。

## ✨ 主要機能

### 🎮 ゲーム機能
- **完全なハーツゲームルール**: カード配布、交換、トリック、スコア計算
- **リアルタイム同期**: Socket.ioによる即座な状態更新
- **4人固定対戦**: North, East, South, West の4つのポジション
- **ゲーム復帰機能**: ブラウザ再起動時の進行中ゲーム復帰
- **有効カードハイライト**: プレイ可能なカードの視覚的表示

### 🎯 UI/UX
- **直感的な操作**: ドラッグ&ドロップ、クリック操作
- **東西南北配置**: 実際のカードゲームと同様のプレイヤー配置
- **リアルタイムスコア表示**: Chart.jsによる視覚的スコアグラフ
- **レスポンシブデザイン**: PC・タブレット・スマートフォン対応
- **カード画像**: 美しいSVGカードデザイン

### 📊 履歴・統計
- **ゲーム履歴**: 過去のゲーム記録閲覧
- **詳細分析**: ハンド別スコア、プレイ履歴
- **フィルタリング・ソート**: 日付、プレイヤー、スコア別検索

### 🔧 開発者向け
- **型安全**: TypeScript完全対応
- **包括的テスト**: 242のテストケース（カバレッジ高水準）
- **Docker環境**: 簡単な開発環境構築
- **モダンアーキテクチャ**: Next.js 14 + Express.js + Socket.io

## 🖼️ スクリーンショット

<!-- TODO: ゲーム画面のスクリーンショットを追加 -->
> スクリーンショットは開発完了後に追加予定

## 🚀 デモ

**ローカル環境でのプレイが可能です:**
1. `docker-compose up -d` でサービス起動
2. `http://localhost:3000` でゲーム開始
3. 4人のプレイヤーでログイン
4. ハーツゲームをお楽しみください！

---

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Socket.io-client**
- **Chart.js** (スコアグラフ)
- **React Hooks** (状態管理)

### バックエンド
- **Node.js**
- **Express.js**
- **TypeScript**
- **Socket.io** (リアルタイム通信)
- **Prisma** (ORM)

### データベース
- **PostgreSQL**
- **JSONB型** (柔軟なデータ構造)

### 開発環境
- **Docker Compose** (モノレポ構成)
- **Jest** (テストフレームワーク)
- **ESLint & Prettier** (コード品質管理)

### アーキテクチャ

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│                 │ ←────────────→ │                 │
│  Next.js 14     │                 │  Express.js     │
│  (Frontend)     │                 │  (Backend)      │
│                 │                 │                 │
│  - React        │                 │  - Socket.io    │
│  - TypeScript   │                 │  - GameEngine   │
│  - Tailwind CSS │                 │  - Repositories │
│                 │                 │                 │
└─────────────────┘                 └─────────────────┘
                                            │
                                            │ Prisma ORM
                                            ▼
                                    ┌─────────────────┐
                                    │                 │
                                    │  PostgreSQL     │
                                    │  Database       │
                                    │                 │
                                    └─────────────────┘
```

---

## 📦 インストール・セットアップ

### 前提条件
- **Docker** & **Docker Compose**
- **Node.js 18+** (ローカル開発の場合)
- **npm 9+**

### 1. リポジトリクローン
```bash
git clone https://github.com/yourusername/manta.git
cd manta
```

### 2. Docker環境での起動（推奨）
```bash
# 全サービス起動
docker-compose up -d

# サービス確認
docker-compose ps

# ログ確認
docker-compose logs -f
```

### 3. ローカル環境での起動
```bash
# データベース起動
docker-compose up -d postgres

# バックエンド起動
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev

# 新しいターミナルでフロントエンド起動
cd frontend
npm install
npm run dev
```

### 4. アクセス
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001
- **Prisma Studio**: `npm run prisma:studio` (http://localhost:5555)

---

## 🎮 使用方法

### ゲームの始め方
1. **プレイヤー選択**: トップページで4人のプレイヤーを選択
2. **ログイン**: 各プレイヤーでログイン
3. **ゲーム参加**: ゲームロビーで参加
4. **ゲーム開始**: 4人揃うと自動的にゲーム開始

### ハーツゲームルール
- **目的**: 最低得点を目指す（ペナルティカードを避ける）
- **ペナルティ**: ハート = 1点、スペードQ = 13点
- **カード交換**: 各ハンドの開始時に3枚交換
- **プレイ**: クラブ2からスタート、時計回りにプレイ
- **終了条件**: 誰かが100点に到達（設定変更可能）

### 特殊ルール
- **ハートブレイク**: ハートが場に出るまでハートでリードできない
- **シュートザムーン**: 全ペナルティカード（26点）を取ると他プレイヤーに26点追加

---

## 👩‍💻 開発者向け情報

### 開発コマンド

#### バックエンド開発
```bash
cd backend
npm run dev             # 開発サーバー起動 (http://localhost:3001)
npm test               # テスト実行（175テスト）
npm run test:watch     # テスト監視モード
npm run type-check     # TypeScript型チェック
npm run lint           # ESLint実行
npm run format         # Prettier実行
```

#### フロントエンド開発
```bash
cd frontend
npm run dev             # 開発サーバー起動 (http://localhost:3000)
npm test               # テスト実行（67テスト）
npm run test:watch     # テスト監視モード
npm run type-check     # TypeScript型チェック
npm run lint           # ESLint実行
npm run format         # Prettier実行
```

#### データベース操作
```bash
cd backend
npm run prisma:generate  # Prismaクライアント生成
npm run prisma:push     # スキーマをDBにプッシュ
npm run prisma:migrate  # マイグレーション実行
npm run prisma:studio   # Prisma Studio起動
npm run prisma:seed     # シードデータ投入
```

### テスト実行
```bash
# 全テスト実行（推奨順序）
cd backend && npm test        # バックエンド（175テスト）
cd frontend && npm test       # フロントエンド（67テスト）

# 品質チェック
cd backend && npm run type-check && npm run lint
cd frontend && npm run type-check && npm run lint
```

### プロジェクト構造
```
manta/
├── frontend/           # Next.js フロントエンド
│   ├── src/app/       # App Router
│   ├── src/components/ # Reactコンポーネント
│   ├── src/hooks/     # カスタムフック
│   └── src/types/     # 型定義
├── backend/           # Express バックエンド
│   ├── src/routes/    # REST API
│   ├── src/socket/    # Socket.io handlers
│   ├── src/game/      # ゲームロジック
│   ├── src/repositories/ # データアクセス層
│   └── src/services/  # ビジネスロジック
└── docs/             # ドキュメント
```

### コントリビューション
1. **Fork** このリポジトリ
2. **Feature branch** 作成: `git checkout -b feature/amazing-feature`
3. **Commit**: `git commit -m 'Add amazing feature'`
4. **Push**: `git push origin feature/amazing-feature`
5. **Pull Request** 作成

### 開発ガイドライン
- **テスト駆動開発**: 新機能実装前にテスト作成
- **型安全性**: TypeScript厳密モード準拠
- **コード品質**: ESLint・Prettier使用
- **コミット**: 意味のある単位でコミット

---

## 📋 プロジェクト状況

### 実装進捗
- **完了フェーズ**: 11/14フェーズ（78%完了）
- **テスト数**: 242テスト（バックエンド175 + フロントエンド67）
- **実装期間**: 2025年5月-6月

### 動作確認済み機能
- ✅ 完全なハーツゲームルール
- ✅ リアルタイム4人対戦
- ✅ ゲーム履歴・統計表示
- ✅ レスポンシブUI
- ✅ ゲーム復帰機能

### 開発中機能
- 🔄 データ永続化詳細
- 🔄 UI/UXアニメーション
- 📋 パフォーマンス最適化

---

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🙏 クレジット

- **カードデザイン**: SVGカードセット
- **ゲームルール**: 伝統的なハーツカードゲーム
- **開発**: TypeScript + Next.js + Express.js
- **テスト**: Jest + React Testing Library

---

## 📞 サポート

問題やご質問がございましたら、[Issues](https://github.com/yourusername/manta/issues) でお気軽にお声がけください。

---

**楽しいハーツゲームを！🃏**