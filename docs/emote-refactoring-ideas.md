# エモート機能の実装調査結果

## 現在の実装概要

エモート機能は、プレイヤー間でリアルタイムに感情表現を共有する機能として実装されています。バックエンドのSocket.ioハンドラーとフロントエンドのReactコンポーネントで構成されています。

## 主な問題点と改善案

### 1. 重複コードの存在

**問題点:**
- エモートタイプ（`'👎'`, `'🔥'`, `'🚮'`）が複数箇所でハードコード
- バックエンドとフロントエンドで同じ型定義が重複
- エモート配列/オブジェクトが複数コンポーネントで定義

**改善案:**
```typescript
// shared/constants/emotes.ts（新規作成）
export const EMOTE_TYPES = {
  THUMBS_DOWN: '👎',
  FIRE: '🔥',
  TRASH: '🚮'
} as const;

export const EMOTE_LIST = Object.values(EMOTE_TYPES);
export type EmoteType = typeof EMOTE_LIST[number];
```

### 2. バリデーションの簡素化

**現在の実装:**
```typescript
// backend/src/socket/handlers.ts:233
if (!['👎', '🔥', '🚮'].includes(emoteType)) {
  socket.emit('error', '無効なエモートタイプです');
  return;
}
```

**改善案:**
```typescript
import { EMOTE_LIST } from '@shared/constants/emotes';

const isValidEmoteType = (type: string): type is EmoteType => {
  return EMOTE_LIST.includes(type as EmoteType);
};

if (!isValidEmoteType(emoteType)) {
  socket.emit('error', ERROR_MESSAGES.INVALID_EMOTE);
  return;
}
```

### 3. 不要なtimestampの削除

**問題点:**
- `receiveEmote`イベントで送信される`timestamp`が未使用
- フロントエンドで保存されるが活用されていない

**改善案:**
```typescript
// バックエンド（backend/src/socket/handlers.ts:251-255）
// 現在
playerSocket.emit('receiveEmote', {
  fromPlayerId: playerId,
  emoteType,
  timestamp  // 削除可能
});

// 改善後
playerSocket.emit('receiveEmote', {
  fromPlayerId: playerId,
  emoteType
});
```

### 4. マジックナンバーの定数化

**問題点:**
- エモート表示時間（2000ms）がハードコード
- エラーメッセージがハードコード

**改善案:**
```typescript
// shared/constants/emotes.ts
export const EMOTE_CONFIG = {
  DISPLAY_DURATION_MS: 2000,
  ANIMATION_DELAY_MS: 300
};

export const EMOTE_ERROR_MESSAGES = {
  NOT_IN_GAME: 'ゲームに参加していません',
  INVALID_TYPE: '無効なエモートタイプです',
  SEND_FAILED: 'エモート送信に失敗しました'
};
```

### 5. EmoteBubbleコンポーネントの簡素化

**問題点:**
- 位置計算のswitch文が冗長
- スタイル定義が長い

**改善案:**
```typescript
// 位置スタイルを事前定義
const POSITION_STYLES = {
  top: { top: '50%', left: '100%', transform: 'translateY(-50%)', marginLeft: '12px' },
  right: { top: '50%', right: '100%', transform: 'translateY(-50%)', marginRight: '12px' },
  // ...
};

const getPositionStyles = () => POSITION_STYLES[position] || POSITION_STYLES.default;
```

### 6. 型定義の共有

**問題点:**
- バックエンドとフロントエンドで`EmoteType`が重複定義

**改善案:**
- モノレポ構成を活かして共通パッケージを作成
- または、型定義ファイルをシンボリックリンクで共有

### 7. テストの改善

**問題点:**
- エモート関連のフロントエンドテストが一部失敗

**改善案:**
- モック関数の適切な設定
- タイマーのモック化（`jest.useFakeTimers()`）

## 実装の優先順位

### 1. 高優先度（即座に改善可能）→実施済
- ~~timestampの削除~~
- ~~マジックナンバーの定数化~~
- ~~エラーメッセージの定数化~~

### 2. 中優先度（リファクタリング必要）
- エモートタイプの共通定数化
- バリデーション関数の共通化
- EmoteBubbleの簡素化

### 3. 低優先度（構造的な変更必要）
- 型定義の共有化
- 共通パッケージの作成
