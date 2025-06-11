import React from 'react';
import { GameState, EmoteType } from '../../types';

interface EmoteButtonsProps {
  socket: any; // Socket instance or null
  gameState: GameState;
}

export const EmoteButtons: React.FC<EmoteButtonsProps> = ({ socket, gameState }) => {
  // ゲーム中（交換フェーズまたはプレイフェーズ）のみ表示
  const shouldShowButtons = gameState.phase === 'exchanging' || gameState.phase === 'playing';

  if (!shouldShowButtons) {
    return null;
  }

  const handleEmoteClick = (emoteType: EmoteType) => {
    // ソケットが存在し、接続されている場合のみエモートを送信
    if (socket && socket.connected) {
      socket.emit('sendEmote', emoteType);
    }
  };

  const emotes: Array<{ type: EmoteType; label: string }> = [
    { type: '👎', label: '👎' },
    { type: '🔥', label: '🔥' },
    { type: '🚮', label: '🚮' },
  ];

  return (
    <div className="flex space-x-2 p-2 bg-green-800 rounded-lg border-2 border-yellow-400 shadow-lg">
      {emotes.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => handleEmoteClick(type)}
          className="
            w-12 h-12 
            bg-white hover:bg-yellow-100 
            border-2 border-yellow-400 hover:border-yellow-500
            rounded-lg 
            text-xl 
            flex items-center justify-center 
            transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50
            active:bg-yellow-200 active:scale-95
            shadow-md hover:shadow-lg
            cursor-pointer
          "
          aria-label={label}
          title={`エモート: ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default EmoteButtons;