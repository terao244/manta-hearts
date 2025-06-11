# エモート機能実装計画

仕様は　@docs/emote-feature-spec.md 参照

## 実装方針
- **テストファースト開発（TDD）**: 各ステップでテストを先に作成し、テストがパスするように実装を進める
- **段階的実装**: バックエンド→フロントエンド送信→フロントエンド受信の順で実装
- **型安全性重視**: TypeScriptの型定義から開始

## 実装ステップ

### ✅ ステップ1: 型定義の追加 【完了】
1. **✅ バックエンド型定義テストの作成**
   - `backend/src/__tests__/types/emote.test.ts` - 5テスト作成・成功
   - エモート型の存在確認テスト
   - Socket.ioイベント型の拡張確認テスト

2. **✅ バックエンド型定義の実装**
   - `backend/src/types/index.ts`に追加:
     - `EmoteType`型定義
     - `ClientToServerEvents`に`sendEmote`追加
     - `ServerToClientEvents`に`receiveEmote`追加

3. **✅ フロントエンド型定義テストの作成**
   - `frontend/src/types/__tests__/emote.test.ts` - 5テスト作成・成功
   - エモート型の存在確認テスト

4. **✅ フロントエンド型定義の実装**
   - `frontend/src/types/index.ts`に追加:
     - `EmoteType`型定義
     - Socket.ioイベント型の拡張

### ✅ ステップ2: バックエンドSocket.ioハンドラー実装 【完了】
1. **✅ ハンドラーテストの作成**
   - `backend/src/__tests__/socket/emoteHandlers.test.ts` - 5テスト作成・成功
   - テストケース:
     - 有効なエモート送信時、全プレイヤーに配信される
     - 無効なエモートタイプは拒否される
     - ゲーム未参加者からの送信は拒否される
     - 送信者情報が正しく含まれる

2. **✅ ハンドラーの実装**
   - `backend/src/socket/handlers.ts`を更新:
     - `sendEmote`イベントハンドラー追加
     - バリデーション処理実装
     - 全プレイヤーへの配信処理実装

### ✅ ステップ3: フロントエンドエモートボタンコンポーネント 【完了】
1. **✅ EmoteButtonsコンポーネントテストの作成**
   - `frontend/src/components/game/__tests__/EmoteButtons.test.tsx` - 12テスト作成・成功
   - テストケース:
     - 3つのエモートボタンが表示される
     - ゲーム中のみ表示される（exchanging/playingフェーズ）
     - ボタンクリックでsendEmoteイベントが発火する
     - 各ボタンが正しいエモートタイプを送信する
     - ソケット接続状態のハンドリング

2. **✅ EmoteButtonsコンポーネントの実装**
   - `frontend/src/components/game/EmoteButtons.tsx` - 完全実装
   - プロップス: `socket`, `gameState`
   - 3つのボタンを横並びで表示（👎、🔥、🚮）
   - クリックハンドラーでSocket.io送信
   - Tailwind CSSによるスタイリング

### ステップ4: フロントエンドエモート表示コンポーネント
1. **EmoteBubbleコンポーネントテストの作成**
   - `frontend/src/components/game/__tests__/EmoteBubble.test.tsx`
   - テストケース:
     - エモートが吹き出し内に表示される
     - 2秒後に自動的に非表示になる
     - 複数エモート受信時は最新のものに更新される
     - フェードイン・アウトのクラスが適用される

2. **EmoteBubbleコンポーネントの実装**
   - `frontend/src/components/game/EmoteBubble.tsx`
   - プロップス: `emoteType`, `isVisible`
   - Tailwind CSSでアニメーション実装
   - 吹き出しデザインの実装

### ステップ5: GameBoardへの統合
1. **GameBoard統合テストの作成**
   - `frontend/src/components/game/__tests__/GameBoard.emote.test.tsx`
   - テストケース:
     - 自分のプレイヤー名横にEmoteButtonsが表示される
     - receiveEmoteイベント受信時に該当プレイヤーにEmoteBubbleが表示される
     - 複数プレイヤーのエモートが同時に表示可能

2. **GameBoardの更新**
   - `frontend/src/components/game/GameBoard.tsx`を更新:
     - EmoteButtonsコンポーネントの配置
     - 各プレイヤーのエモート状態管理
     - receiveEmoteイベントリスナーの追加
     - EmoteBubbleコンポーネントの配置

### ステップ6: useGameフックの拡張
1. **useGameフック拡張テストの作成**
   - `frontend/src/hooks/__tests__/useGame.emote.test.ts`
   - テストケース:
     - sendEmote関数が提供される
     - playerEmotesステートが管理される
     - receiveEmoteイベントでステートが更新される

2. **useGameフックの更新**
   - `frontend/src/hooks/useGame.ts`を更新:
     - `sendEmote`関数の追加
     - `playerEmotes`ステートの追加
     - `receiveEmote`イベントハンドラーの追加

### ステップ7: 統合テスト
1. **E2Eテストシナリオの作成**
   - 複数ブラウザでのエモート送受信テスト
   - ゲーム中・ゲーム外での動作確認

2. **パフォーマンステスト**
   - 連続送信時の動作確認
   - メモリリークの確認

### ステップ8: UI/UXの洗練
1. **デザイン調整**
   - ボタンのホバー効果
   - 押下時のフィードバック
   - 吹き出しのデザイン改善

2. **アクセシビリティ**
   - キーボードナビゲーション対応
   - スクリーンリーダー対応

## 各ステップの見積もり時間
- ステップ1（型定義）: 30分
- ステップ2（バックエンド）: 1時間
- ステップ3（送信UI）: 1時間
- ステップ4（表示UI）: 1.5時間
- ステップ5（統合）: 1.5時間
- ステップ6（フック拡張）: 1時間
- ステップ7（統合テスト）: 30分
- ステップ8（UI洗練）: 30分

**合計見積もり**: 約7時間

## 成功基準
- すべてのユニットテストがパスする
- 既存の168個のバックエンドテストが引き続きパスする
- 既存の30個のフロントエンドテストが引き続きパスする
- TypeScriptの型チェックでエラーが発生しない
- ESLintでエラーが発生しない
- 4人でのマルチプレイテストで問題なく動作する