// エモート関連の定数定義

// エモート表示時間設定
export const EMOTE_CONFIG = {
  DISPLAY_DURATION_MS: 2000,
  ANIMATION_DELAY_MS: 300
} as const;

// エモートエラーメッセージ
export const EMOTE_ERROR_MESSAGES = {
  NOT_IN_GAME: 'ゲームに参加していません',
  INVALID_TYPE: '無効なエモートタイプです',
  SEND_FAILED: 'エモート送信に失敗しました'
} as const;

// エモートタイプ定義
export const EMOTE_TYPES = {
  THUMBS_DOWN: '👎',
  FIRE: '🔥',
  TRASH: '🚮'
} as const;

export const EMOTE_LIST = Object.values(EMOTE_TYPES);
export type EmoteType = typeof EMOTE_LIST[number];

// エモートバリデーション関数  
export const isValidEmoteType = (type: string): type is EmoteType => {
  return EMOTE_LIST.includes(type as EmoteType);
};