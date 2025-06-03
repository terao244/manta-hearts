# Phase 13: データ永続化詳細

## 概要
ゲーム進行中のリアルタイムデータ永続化によりゲーム復帰・履歴詳細表示・統計機能の基盤を構築するフェーズです。

## 実装目的
ゲーム進行中のリアルタイムデータ永続化によりゲーム復帰・履歴詳細表示・統計機能の基盤構築

## 現在の状況
- ✅ 基本ゲーム作成・結果保存実装済み（Game テーブル）
- ✅ Prismaスキーマ完全設計済み（9テーブル: Hand、HandCard、CardExchange、HandScore、Trick、TrickCard等）
- ⚠️ 詳細データ永続化未実装（ハンド・トリック・カード交換詳細）

## 33. ゲーム保存処理（完全実装）

### 33.1 ハンド保存処理実装 ✅ **完了**
- [x] 🧪 Handテーブル保存テスト作成
  - ハンド開始時のHand レコード作成テスト
  - ハンド番号、ハートブレイク、シュートザムーン情報保存テスト
  - GameService.onHandStarted イベント連携テスト
- [x] 📝 HandRepository実装
  - createHand(gameId, handNumber, heartsBroken?, shootTheMoonPlayerId?) メソッド
  - updateHand(handId, updates) メソッド（ハートブレイク、シュートザムーン更新用）
  - findByGameId(gameId) メソッド
  - 依存性注入パターン対応（Container.ts）
- [x] 📝 GameService.onHandStarted イベント連携
  - ハンド開始時にHandテーブルへのレコード作成処理追加
  - handId をゲーム状態に保持する仕組み実装
  - エラーハンドリング（DB保存失敗時の処理）
- [x] 📝 GameService.onHandCompleted イベント連携
  - ハートブレイク・シュートザムーン情報の更新処理
  - ハンド終了時のスコア確定処理

### 33.2 初期カード配布保存処理実装 ✅ **完了**
- [x] 🧪 HandCardテーブル保存テスト作成
  - カード配布時のHandCardレコード作成テスト（プレイヤー4人×13枚=52レコード）
  - GameService.onCardsDealt イベント連携テスト
  - カードIDとプレイヤーIDの正確な保存確認テスト
- [x] 📝 HandCardRepository実装
  - saveHandCards(handId, playerCards: Map<playerId, cardIds[]>) メソッド
  - findByHandId(handId) メソッド
  - bulkInsert最適化（52レコードの効率的な一括挿入）
- [x] 📝 GameService.onCardsDealt イベント連携
  - カード配布時にHandCardテーブルへの一括保存処理追加
  - カードID解決処理（Card.id とゲーム内カードオブジェクトのマッピング）
  - トランザクション処理（52レコードの原子性保証）

### 33.3 カード交換保存処理実装
- [ ] 🧪 CardExchangeテーブル保存テスト作成
  - カード交換完了時のCardExchangeレコード作成テスト
  - 交換方向（左隣・右隣・向かい・なし）別テスト
  - exchangeOrder（1-3）の正確な保存テスト
- [ ] 📝 CardExchangeRepository実装
  - saveCardExchanges(handId, exchanges: CardExchange[]) メソッド
  - findByHandId(handId) メソッド
  - 交換方向ロジック統合（GameEngine.getExchangeDirection()）
- [ ] 📝 GameEngine.performExchange イベント連携
  - カード交換完了時にCardExchangeテーブルへの保存処理追加
  - fromPlayerId、toPlayerId、cardId、exchangeOrderの正確な記録
  - 4ハンド目（交換なし）の適切な処理

### 33.4 トリック保存処理実装
- [ ] 🧪 Trickテーブル保存テスト作成
  - トリック完了時のTrickレコード作成テスト
  - 勝者、ポイント、リードプレイヤーの正確な保存テスト
  - GameService.onTrickCompleted イベント連携テスト
- [ ] 📝 TrickRepository実装
  - createTrick(handId, trickNumber, winnerId, points, leadPlayerId) メソッド
  - findByHandId(handId) メソッド
  - bulkInsert対応（13トリック分の効率的保存）
- [ ] 📝 GameService.onTrickCompleted イベント連携
  - トリック完了時にTrickテーブルへのレコード作成処理追加
  - trickId をゲーム状態に保持する仕組み実装
  - ポイント計算結果の保存（ハート・スペードQ検出）

### 33.5 トリックカード保存処理実装
- [ ] 🧪 TrickCardテーブル保存テスト作成
  - カードプレイ時のTrickCardレコード作成テスト
  - playOrder（1-4）の正確な記録テスト
  - 4プレイヤー×13トリック=52レコードの一括保存テスト
- [ ] 📝 TrickCardRepository実装
  - saveTrickCard(trickId, playerId, cardId, playOrder) メソッド
  - saveTrickCards(trickId, trickCards: TrickCard[]) メソッド（一括保存）
  - findByTrickId(trickId) メソッド
- [ ] 📝 GameService.onCardPlayed イベント連携
  - カードプレイ時にTrickCardテーブルへのレコード作成処理追加
  - プレイ順序の正確な記録（1番目、2番目、3番目、4番目）
  - トリック進行状態の管理

### 33.6 ハンドスコア詳細保存処理実装
- [ ] 🧪 HandScoreテーブル保存テスト作成
  - ハンド完了時のHandScoreレコード作成テスト（プレイヤー4人分）
  - handPoints、cumulativePoints、heartsTaken、queenOfSpadesTaken詳細保存テスト
  - シュートザムーン達成時の特別処理テスト
- [ ] 📝 HandScoreRepository実装
  - saveHandScores(handId, handScores: HandScore[]) メソッド
  - findByHandId(handId) メソッド
  - calculateDetailedScore(playerId, hand) メソッド（詳細スコア計算）
- [ ] 📝 GameService.onHandCompleted イベント連携
  - ハンド完了時にHandScoreテーブルへの詳細スコア保存処理追加
  - ハート取得枚数、スペードQ取得、シュートザムーン達成の詳細記録
  - cumulative score の正確な計算・保存

### 33.7 統合保存処理とトランザクション管理
- [ ] 🧪 統合保存処理テスト作成
  - 1ハンド完了時の全テーブル一貫性テスト
  - トランザクション失敗時のロールバック処理テスト
  - 大量データ保存時のパフォーマンステスト
- [ ] 📝 GamePersistenceService実装
  - ゲーム永続化の統括サービスクラス
  - トランザクション管理（Prisma.$transaction）
  - バッチ保存処理の最適化
  - エラーハンドリングとリトライ機能
- [ ] 📝 GameService統合
  - 既存GameServiceへのGamePersistenceService組み込み
  - 全イベントハンドラーでの保存処理呼び出し追加
  - メモリ使用量最適化（大量データ保存時）

### 33.8 データ整合性・パフォーマンス
- [ ] 🧪 データ整合性テスト作成
  - 外部キー制約テスト（Hand→Game、Trick→Hand等）
  - ユニーク制約テスト（handNumber、trickNumber等）
  - カスケード削除テスト
- [ ] 📝 データベースインデックス最適化
  - 高頻度クエリ用インデックス追加
  - 複合インデックス設計（gameId+handNumber等）
  - クエリ実行計画の分析・最適化
- [ ] 📝 パフォーマンス監視
  - 保存処理の実行時間計測
  - メモリ使用量監視
  - DB接続プール最適化

## 34. リアルタイム同期
- [ ] 📝 状態変更→DB保存
- [ ] 📝 DB保存→クライアント通知
- [ ] 🧪 同期テスト

## 技術的要件
- **トランザクション**: 関連するデータの原子性保証（Prisma.$transaction使用）
- **バッチ処理**: 大量レコード（52枚カード等）の効率的な一括処理
- **エラーハンドリング**: DB保存失敗時のゲーム進行継続機能
- **型安全性**: Repository層での完全な型安全性確保
- **テスト**: モック戦略によるユニットテスト + 統合テスト

## 完了時の成果物
- ゲーム詳細履歴の完全な永続化（手札配布からスコア詳細まで）
- ゲーム復帰機能の基盤データ
- 統計機能・分析機能の詳細データソース
- パフォーマンス最適化されたデータ保存処理

## 凡例
- [ ] 未着手
- [x] 完了
- 🧪 テスト作成を含むタスク
- 📝 ドキュメント作成を含むタスク
- 🔧 設定・環境構築タスク