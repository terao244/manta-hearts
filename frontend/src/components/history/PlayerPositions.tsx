'use client';

import React from 'react';
import { GameDetailData } from '../../types';

interface PlayerPositionsProps {
  players: GameDetailData['players'];
}

export default function PlayerPositions({ players }: PlayerPositionsProps) {
  if (!players || players.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        プレイヤー席順情報がありません
      </div>
    );
  }

  // 席順別にプレイヤーを配置
  const getPlayerByPosition = (position: string) => {
    return players.find(player => player.position === position);
  };

  const northPlayer = getPlayerByPosition('North');
  const eastPlayer = getPlayerByPosition('East');
  const southPlayer = getPlayerByPosition('South');
  const westPlayer = getPlayerByPosition('West');

  const PlayerCard = ({ player, position }: { player: GameDetailData['players'][0] | undefined; position: string }) => {
    if (!player) {
      return (
        <div className="w-20 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-400">{position}</span>
        </div>
      );
    }

    return (
      <div className="w-20 h-16 bg-blue-50 border border-blue-300 rounded-lg flex flex-col items-center justify-center p-1">
        <div className="text-xs font-semibold text-blue-800 truncate w-full text-center" title={player.name}>
          {player.name}
        </div>
        <div className="text-xs text-blue-600">
          {player.finalScore}点
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">プレイヤー席順</h3>
      
      {/* 席順図と詳細テーブルを横並び */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 席順図（左側） */}
        <div className="flex-shrink-0">
          <h4 className="text-md font-medium text-gray-900 mb-2">席順図</h4>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* 北（上） */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">北</div>
                  <PlayerCard player={northPlayer} position="North" />
                </div>
              </div>

              {/* 東（右） */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">東</div>
                  <PlayerCard player={eastPlayer} position="East" />
                </div>
              </div>

              {/* 南（下） */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">南</div>
                  <PlayerCard player={southPlayer} position="South" />
                </div>
              </div>

              {/* 西（左） */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">西</div>
                  <PlayerCard player={westPlayer} position="West" />
                </div>
              </div>

              {/* 中央のテーブル */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-green-100 border border-green-300 rounded-full flex items-center justify-center">
                  <span className="text-xs text-green-700 font-medium">テーブル</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* プレイヤー情報テーブル（右側） */}
        <div className="flex-1 min-w-0">
          <h4 className="text-md font-medium text-gray-900 mb-2">プレイヤー詳細</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left font-medium">席順</th>
                  <th className="border border-gray-300 px-2 py-1 text-left font-medium">プレイヤー名</th>
                  <th className="border border-gray-300 px-2 py-1 text-center font-medium">最終スコア</th>
                  <th className="border border-gray-300 px-2 py-1 text-center font-medium">順位</th>
                </tr>
              </thead>
              <tbody>
                {players
                  .sort((a, b) => a.finalScore - b.finalScore) // スコア順でソート
                  .map((player, index) => (
                    <tr key={player.id} className={index === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="border border-gray-300 px-2 py-1 font-medium">
                        {player.position}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {player.name}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center font-medium">
                        {player.finalScore}点
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}