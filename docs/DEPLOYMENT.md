# Manta Hearts - クラウドデプロイメント手順書

## 概要

Manta Hearts（ハーツカードゲーム）をクラウド環境にデプロイするための包括的な手順書です。本プロジェクトは以下の構成となっています：

- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Node.js + Express + Socket.io + TypeScript + Prisma
- **データベース**: PostgreSQL
- **アーキテクチャ**: モノレポ構成（frontend/backend分離）

## 前提条件

- Node.js 18以上
- PostgreSQLデータベース
- Git リポジトリ
- 選択したクラウドプラットフォームのアカウント

## 1. Railway デプロイ（推奨）

### 特徴
- フルスタックアプリケーションに最適
- PostgreSQLマネージドサービス提供
- Dockerfile自動認識
- 環境変数管理が簡単

### 手順

#### 1.1 Railwayアカウント設定
```bash
# Railway CLI インストール
npm install -g @railway/cli

# ログイン
railway login
```

#### 1.2 プロジェクト作成
```bash
# プロジェクト作成
railway new

# PostgreSQLデータベース追加
railway add postgresql
```

#### 1.3 環境変数設定

**バックエンド環境変数:**
```bash
DATABASE_URL=postgresql://user:password@host:port/database  # Railway自動生成
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.railway.app
GAME_END_SCORE=100
```

**フロントエンド環境変数:**
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.railway.app
```

#### 1.4 デプロイ用Dockerfileの修正

**backend/Dockerfile (本番用修正):**
```dockerfile
FROM node:18-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3001

# Prismaマイグレーション実行後にサーバー起動
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

**frontend/Dockerfile (本番用修正):**
```dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### 1.5 デプロイ実行
```bash
# バックエンドデプロイ
cd backend
railway up

# フロントエンドデプロイ
cd ../frontend
railway up
```

## 2. Vercel + PlanetScale/Supabase デプロイ

### 特徴
- フロントエンドにVercel（推奨）
- バックエンドは別サービス（Railway/Render等）
- 高速CDN配信

### 手順

#### 2.1 Vercelでフロントエンドデプロイ
```bash
# Vercel CLI インストール
npm install -g vercel

# フロントエンドディレクトリでデプロイ
cd frontend
vercel --prod
```

**Vercel環境変数設定:**
- `NEXT_PUBLIC_BACKEND_URL`: バックエンドのURL

#### 2.2 PlanetScale（MySQL）使用の場合

**prisma/schema.prisma修正:**
```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"
}
```

#### 2.3 Supabase（PostgreSQL）使用の場合

**環境変数:**
```bash
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
```

## 3. AWS ECS/Fargate デプロイ

### 特徴
- 高い可用性とスケーラビリティ
- フルマネージドコンテナサービス
- RDS PostgreSQL使用

### 手順

#### 3.1 ECRリポジトリ作成
```bash
# ECRリポジトリ作成
aws ecr create-repository --repository-name manta-hearts-backend
aws ecr create-repository --repository-name manta-hearts-frontend
```

#### 3.2 Dockerイメージビルド&プッシュ
```bash
# バックエンド
cd backend
docker build -t manta-hearts-backend .
docker tag manta-hearts-backend:latest [ECR-URI]/manta-hearts-backend:latest
docker push [ECR-URI]/manta-hearts-backend:latest

# フロントエンド
cd ../frontend
docker build -t manta-hearts-frontend .
docker tag manta-hearts-frontend:latest [ECR-URI]/manta-hearts-frontend:latest
docker push [ECR-URI]/manta-hearts-frontend:latest
```

#### 3.3 ECS Task Definition例

**task-definition.json:**
```json
{
  "family": "manta-hearts",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "[ECR-URI]/manta-hearts-backend:latest",
      "portMappings": [{"containerPort": 3001}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DATABASE_URL", "value": "postgresql://..."}
      ]
    },
    {
      "name": "frontend",
      "image": "[ECR-URI]/manta-hearts-frontend:latest",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "NEXT_PUBLIC_BACKEND_URL", "value": "https://backend-alb-url"}
      ]
    }
  ]
}
```

## 4. Google Cloud Run デプロイ

### 特徴
- サーバーレス
- 自動スケーリング
- Cloud SQLと連携

### 手順

#### 4.1 Google Cloud設定
```bash
# gcloud CLI認証
gcloud auth login
gcloud config set project [PROJECT-ID]
```

#### 4.2 Cloud SQL PostgreSQLインスタンス作成
```bash
gcloud sql instances create manta-hearts-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=asia-northeast1
```

#### 4.3 Cloud Runデプロイ
```bash
# バックエンド
cd backend
gcloud run deploy manta-hearts-backend \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated

# フロントエンド
cd ../frontend
gcloud run deploy manta-hearts-frontend \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated
```

## 5. Azure Container Apps デプロイ

### 特徴
- マイクロサービスに最適
- KEDA自動スケーリング
- Azure Database for PostgreSQL連携

### 手順

#### 4.1 リソースグループ作成
```bash
az group create --name manta-hearts-rg --location japaneast
```

#### 4.2 Container Apps環境作成
```bash
az containerapp env create \
  --name manta-hearts-env \
  --resource-group manta-hearts-rg \
  --location japaneast
```

#### 4.3 アプリケーションデプロイ
```bash
# バックエンド
az containerapp create \
  --name manta-hearts-backend \
  --resource-group manta-hearts-rg \
  --environment manta-hearts-env \
  --image [ACR-REGISTRY]/manta-hearts-backend:latest \
  --target-port 3001 \
  --ingress external

# フロントエンド
az containerapp create \
  --name manta-hearts-frontend \
  --resource-group manta-hearts-rg \
  --environment manta-hearts-env \
  --image [ACR-REGISTRY]/manta-hearts-frontend:latest \
  --target-port 3000 \
  --ingress external
```

## 6. Heroku デプロイ（個人プロジェクト向け）

### 手順

#### 6.1 Heroku設定
```bash
# Heroku CLI インストール後
heroku login

# アプリ作成
heroku create manta-hearts-backend
heroku create manta-hearts-frontend

# PostgreSQL アドオン追加
heroku addons:create heroku-postgresql:hobby-dev -a manta-hearts-backend
```

#### 6.2 環境変数設定
```bash
# バックエンド
heroku config:set NODE_ENV=production -a manta-hearts-backend
heroku config:set FRONTEND_URL=https://manta-hearts-frontend.herokuapp.com -a manta-hearts-backend

# フロントエンド
heroku config:set NEXT_PUBLIC_BACKEND_URL=https://manta-hearts-backend.herokuapp.com -a manta-hearts-frontend
```

#### 6.3 デプロイ
```bash
# バックエンド
cd backend
git subtree push --prefix=backend heroku main

# フロントエンド
cd frontend
git subtree push --prefix=frontend heroku main
```

## 共通設定とベストプラクティス

### 環境変数一覧

**バックエンド必須環境変数:**
```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
GAME_END_SCORE=100
```

**フロントエンド必須環境変数:**
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

### セキュリティ設定

#### 1. CORS設定の確認
```typescript
// backend/src/server.ts
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
};
```

#### 2. 環境変数の検証
```typescript
// backend/src/config/environment.ts
const requiredEnvVars = [
  'DATABASE_URL',
  'FRONTEND_URL'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### パフォーマンス最適化

#### 1. Database Connection Pooling
```typescript
// backend/src/services/PrismaService.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

#### 2. Next.js最適化
```typescript
// frontend/next.config.ts
const nextConfig = {
  output: 'standalone',
  compress: true,
  optimizeFonts: true,
  experimental: {
    serverComponentsExternalPackages: ['socket.io-client']
  }
};
```

### モニタリングと運用

#### 1. ヘルスチェックエンドポイント
```typescript
// backend/src/routes/health.ts
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

#### 2. ログ設定
```typescript
// backend/src/middleware/logger.ts
import morgan from 'morgan';

const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));
```

### トラブルシューティング

#### よくある問題と解決策

1. **Socket.io接続エラー**
   - CORS設定を確認
   - WebSocket サポートを確認

2. **Prisma マイグレーション失敗**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **環境変数が反映されない**
   - 環境変数名の確認（NEXT_PUBLIC_ プリフィックス）
   - ビルド時と実行時の環境変数設定

4. **パフォーマンス問題**
   - データベース接続プール設定
   - Next.js最適化設定の確認

### CI/CD パイプライン例（GitHub Actions）

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      # バックエンドテスト
      - name: Backend Tests
        run: |
          cd backend
          npm ci
          npm run test
          npm run type-check
          npm run lint
      
      # フロントエンドテスト  
      - name: Frontend Tests
        run: |
          cd frontend
          npm ci
          npm run test
          npm run type-check
          npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      # Railway デプロイ例
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway login --apiKey ${{ secrets.RAILWAY_API_KEY }}
          cd backend && railway up
          cd ../frontend && railway up
```

## まとめ

本手順書では、Manta Heartsプロジェクトの各種クラウドプラットフォームへのデプロイ方法を説明しました。

**推奨プラットフォーム：**
- **個人・小規模**: Railway（簡単で費用効率が良い）
- **企業・大規模**: AWS ECS/Fargate（高い可用性）
- **フロントエンド**: Vercel（高速配信）

各プラットフォームの選択は、要件、予算、運用体制に応じて決定してください。