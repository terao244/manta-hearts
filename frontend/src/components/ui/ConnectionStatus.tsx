'use client';

import React from 'react';
import type { ConnectionState } from '@/types';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionState
}) => {
  const { isConnected, isConnecting, error, reconnectAttempts } = connectionState;

  if (isConnected) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
          <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></div>
          接続中
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
          {reconnectAttempts > 0 ? `再接続中... (${reconnectAttempts})` : '接続中...'}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
        <div className="w-2 h-2 bg-red-300 rounded-full mr-2"></div>
        切断
        {error && (
          <div className="ml-2 text-xs bg-red-600 px-2 py-1 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};