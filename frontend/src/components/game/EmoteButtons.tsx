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
    <div className="flex space-x-2">
      {emotes.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => handleEmoteClick(type)}
          className="
            w-10 h-10 
            bg-gray-100 hover:bg-gray-200 
            border border-gray-300 
            rounded-lg 
            text-xl 
            flex items-center justify-center 
            transition-colors duration-150 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            active:bg-gray-300
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