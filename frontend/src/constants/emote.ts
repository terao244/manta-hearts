// エモート関連の定数定義

// エモート表示時間設定
export const EMOTE_CONFIG = {
  DISPLAY_DURATION_MS: 2000,
  ANIMATION_DELAY_MS: 300
} as const;

// トリック完了表示時間設定
export const TRICK_CONFIG = {
  DISPLAY_DURATION_MS: 2000
} as const;

// エモートタイプ定義（バックエンドと同期）
export const EMOTE_TYPES = {
  THUMBS_DOWN: '👎',
  FIRE: '🔥',
  TRASH: '🚮'
} as const;

export const EMOTE_LIST = Object.values(EMOTE_TYPES);
export type EmoteType = typeof EMOTE_LIST[number];