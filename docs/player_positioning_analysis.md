# プレイヤー席順・表示順・手番・交換相手決定ロジック実装解析

## 概要

Mantaハーツゲームにおけるプレイヤーの席順決定、画面上での表示順、手番の決定、カード交換相手の決定について、実装コードを詳しく解析した結果をまとめます。

## 1. 席順の決定ロジック

### 1.1 バックエンドでの席順決定

**ファイル**: `backend/src/services/GameService.ts:668-684`

```typescript
private assignPlayerPosition(gameId: number): PlayerPosition {
  const players = this.gamePlayersMap.get(gameId);
  const playerCount = players ? players.size : 0;

  switch (playerCount) {
    case 0:
      return PlayerPosition.NORTH;
    case 1:
      return PlayerPosition.EAST;
    case 2:
      return PlayerPosition.SOUTH;
    case 3:
      return PlayerPosition.WEST;
    default:
      throw new Error('Game is full');
  }
}
```

**席順の割り当てルール**:
- 1番目のプレイヤー: `NORTH`（北）
- 2番目のプレイヤー: `EAST`（東）
- 3番目のプレイヤー: `SOUTH`（南）
- 4番目のプレイヤー: `WEST`（西）

### 1.2 座席データ構造

**ファイル**: `backend/src/game/Player.ts:15-20`

```typescript
export enum PlayerPosition {
  NORTH = 'North',
  EAST = 'East', 
  SOUTH = 'South',
  WEST = 'West'
}
```

**座席管理クラス**: `PlayerManager` (backend/src/game/Player.ts:28-216)
- `positions: Map<PlayerPosition, number>` - ポジションとプレイヤーIDのマッピング
- `static getPositions(): PlayerPosition[]` - 標準順序 `[NORTH, EAST, SOUTH, WEST]`
- `static getNextPosition(position): PlayerPosition` - 次のポジション計算

## 2. フロントエンドでのプレイヤー表示順決定ロジック

### 2.1 相対位置計算ロジック（2025/06/05 更新）

**ファイル**: `frontend/src/components/game/GameBoard.tsx:151-158`

```typescript
const getPlayerPosition = (playerId: number): RelativePosition | '' => {
  if (!currentPlayerId) return '';
  const positions: RelativePosition[] = ['bottom', 'left', 'top', 'right'];
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  const playerIndex = players.findIndex(p => p.id === playerId);
  const relativeIndex = (playerIndex - currentIndex + 4) % 4;
  return positions[relativeIndex];
};
```

**表示位置の決定ルール**:
- **現在のプレイヤーは常に`bottom`（下）**に表示
- その他のプレイヤーは相対的な位置に配置される
- `positions = ['bottom', 'left', 'top', 'right']` の順序で配置
- **バックエンドの絶対位置（North/East/South/West）と区別するため、フロントエンドでは相対位置表記を使用**

### 2.2 画面上での配置（2025/06/05 更新）

**ファイル**: `frontend/src/components/game/GameBoard.tsx:245-287`

```typescript
{/* 上のプレイヤー */}
{players.filter(p => getPlayerPosition(p.id) === 'top').map(player => (
  <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
    <PlayerCard player={player} ... />
  </div>
))}

{/* 右のプレイヤー */}
{players.filter(p => getPlayerPosition(p.id) === 'right').map(player => (
  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
    <PlayerCard player={player} ... />
  </div>
))}

{/* 下のプレイヤー */}
{players.filter(p => getPlayerPosition(p.id) === 'bottom').map(player => (
  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
    <PlayerCard player={player} ... />
  </div>
))}

{/* 左のプレイヤー */}
{players.filter(p => getPlayerPosition(p.id) === 'left').map(player => (
  <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
    <PlayerCard player={player} ... />
  </div>
))}
```

**表示配置**:
- **top**: 画面上部中央
- **right**: 画面右側中央
- **bottom**: 画面下部中央（現在のプレイヤー）
- **left**: 画面左側中央

## 3. 手番の決定方法

### 3.1 基本的な手番決定ロジック

**ファイル**: `backend/src/game/GameState.ts:288-296`

```typescript
public getNextPlayer(currentPlayerId: number): number | null {
  const players = this.getAllPlayers();
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  
  if (currentIndex === -1) return null;
  
  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}
```

**手番の計算ルール**:
- プレイヤー配列のインデックスベースで循環的に次のプレイヤーを決定
- `(currentIndex + 1) % players.length` で計算
- 配列順序に基づく時計回りの手番

### 3.2 ゲーム開始時の手番決定

**ファイル**: `backend/src/game/GameEngine.ts:253-268`

```typescript
private findPlayerWithTwoOfClubs(): number {
  const twoOfClubs = this.deck.findCard(Suit.CLUBS, Rank.TWO);
  if (!twoOfClubs) {
    // フォールバック: 最初のプレイヤー
    return this.gameState.getAllPlayers()[0].id;
  }

  for (const player of this.gameState.getAllPlayers()) {
    if (this.playerManager.hasCard(player.id, twoOfClubs.id)) {
      return player.id;
    }
  }

  // フォールバック: 最初のプレイヤー
  return this.gameState.getAllPlayers()[0].id;
}
```

**ゲーム開始時のルール**:
- **クラブの2を持っているプレイヤーが最初のリードプレイヤー**
- 見つからない場合は最初のプレイヤーがフォールバック

## 4. 交換相手の決定方法

### 4.1 交換相手決定ロジック

**ファイル**: `backend/src/game/GameEngine.ts:215-236`

```typescript
private getExchangeTargetPlayer(playerId: number): number {
  const players = this.gameState.getAllPlayers();
  const currentIndex = players.findIndex(p => p.id === playerId);
  
  let targetIndex: number;
  
  switch (this.gameState.exchangeDirection) {
    case ExchangeDirection.LEFT:
      targetIndex = (currentIndex + 1) % 4;
      break;
    case ExchangeDirection.RIGHT:
      targetIndex = (currentIndex + 3) % 4;
      break;
    case ExchangeDirection.ACROSS:
      targetIndex = (currentIndex + 2) % 4;
      break;
    default:
      return playerId;
  }

  return players[targetIndex].id;
}
```

**交換方向別の計算式**:
- **LEFT（左隣）**: `(currentIndex + 1) % 4`
- **RIGHT（右隣）**: `(currentIndex + 3) % 4`
- **ACROSS（対面）**: `(currentIndex + 2) % 4`
- **NONE（交換なし）**: そのまま

### 4.2 交換方向の決定

**ファイル**: `backend/src/game/GameState.ts:335-338`

```typescript
private setExchangeDirection(): void {
  const directions = [ExchangeDirection.LEFT, ExchangeDirection.RIGHT, ExchangeDirection.ACROSS, ExchangeDirection.NONE];
  this.exchangeDirection = directions[(this.currentHand - 1) % 4];
}
```

**ハンド別の交換方向**:
- **ハンド1**: LEFT（左隣）
- **ハンド2**: RIGHT（右隣）
- **ハンド3**: ACROSS（対面）
- **ハンド4**: NONE（交換なし）
- **ハンド5以降**: 1〜4のサイクルで繰り返し

## 5. データ構造の整理

### 5.1 席順データの型定義（2025/06/05 更新）

**バックエンド** (`backend/src/types/index.ts:186-191`):
```typescript
// バックエンド用絶対位置型（ゲーム内での固定座席）
export type PlayerPosition = 'North' | 'East' | 'South' | 'West';

export interface PlayerPositionMap {
  [playerId: number]: PlayerPosition;
}
```

**フロントエンド** (`frontend/src/types/index.ts:162-169`):
```typescript
// バックエンドとの互換性用（レガシー）
export type PlayerPosition = 'North' | 'East' | 'South' | 'West';

export interface PlayerPositionMap {
  [playerId: number]: PlayerPosition;
}

// フロントエンド画面表示用の相対位置型
export type RelativePosition = 'top' | 'bottom' | 'left' | 'right';
```

### 5.2 交換方向の型定義

**ファイル**: `backend/src/game/GameState.ts:20-25`

```typescript
export enum ExchangeDirection {
  LEFT = 'left',
  RIGHT = 'right', 
  ACROSS = 'across',
  NONE = 'none'
}
```

## 6. 実装のポイント

### 6.1 席順決定の特徴
- **固定順序**: ゲーム参加順によって`NORTH → EAST → SOUTH → WEST`の順で決定
- **不変性**: 一度決定した席順はゲーム終了まで変更されない
- **シンプルな実装**: 参加プレイヤー数によるswitch文での単純な割り当て

### 6.2 フロントエンド表示の特徴（2025/06/05 更新）
- **相対表示**: 現在のプレイヤーを常に下部（bottom）に表示
- **動的計算**: プレイヤーごとに相対位置を計算して表示
- **直感的UI**: 自分を中心とした視点での表示
- **用語分離**: バックエンドの絶対位置（North/East/South/West）とフロントエンドの相対位置（top/bottom/left/right）を明確に区別

### 6.3 手番制御の特徴
- **循環制御**: プレイヤー配列のインデックスベースで循環
- **ルールベース開始**: クラブの2保持者が最初のリーダー
- **シンプルな実装**: 配列インデックスの単純な増加

### 6.4 交換ロジックの特徴
- **周期的交換**: 4ハンドサイクルでの交換パターン
- **相対的計算**: プレイヤー配列のインデックス操作による交換相手決定
- **対称性**: LEFT/RIGHTが対称的な計算式（+1 vs +3）

## 7. まとめ（2025/06/05 更新）

Mantaのプレイヤー席順・表示・手番・交換システムは以下の設計思想に基づいています：

1. **席順**: 参加順による固定的な座席割り当て（バックエンド：North/East/South/West）
2. **表示**: 現在プレイヤー中心の相対的表示（フロントエンド：top/bottom/left/right）
3. **手番**: 配列順による循環的な制御
4. **交換**: ハンド数による周期的な交換パターン
5. **用語体系**: バックエンドとフロントエンドで異なる位置表記を使用し、混乱を回避

### 重要な改善点（2025/06/05）
- **用語の明確化**: バックエンドの「絶対位置」とフロントエンドの「相対位置」を明確に分離
- **型安全性向上**: `RelativePosition`型を新たに定義し、フロントエンドでの型安全性を強化
- **保守性向上**: 位置に関する概念を整理し、開発者の理解を促進

この実装により、ハーツゲームの伝統的なルールに則った、直感的で分かりやすいプレイ体験が提供されています。