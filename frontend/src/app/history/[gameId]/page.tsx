'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  useEffect(() => {
    document.title = `ゲーム詳細 #${gameId} - Manta`;
  }, [gameId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* ブレッドクラム */}
          <div className="mb-6">
            <Breadcrumbs 
              items={[
                { label: 'ホーム', href: '/' },
                { label: 'ゲーム履歴', href: '/history' },
                { label: `ゲーム #${gameId}` }
              ]} 
            />
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ゲーム詳細 #{gameId}
            </h1>
            <p className="text-gray-600">このゲームの詳細情報と履歴を確認できます</p>
          </div>

          {/* ゲーム基本情報 */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ゲーム情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">開始日時</dt>
                <dd className="mt-1 text-sm text-gray-900">読み込み中...</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">終了日時</dt>
                <dd className="mt-1 text-sm text-gray-900">読み込み中...</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">ゲーム時間</dt>
                <dd className="mt-1 text-sm text-gray-900">読み込み中...</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">勝者</dt>
                <dd className="mt-1 text-sm text-gray-900">読み込み中...</dd>
              </div>
            </div>
          </div>

          {/* プレイヤー結果 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">最終結果</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      順位
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プレイヤー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最終スコア
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      位置
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      データを読み込み中...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* スコア推移グラフ */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">スコア推移</h2>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <p className="text-gray-500">
                  スコア推移グラフはAPIクライアント実装後に表示されます
                </p>
              </div>
            </div>
          </div>

          {/* ハンド履歴 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ハンド履歴</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📋</div>
                  <p className="text-gray-500">
                    ハンド履歴はAPIクライアント実装後に表示されます
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 戻るボタン */}
          <div className="flex justify-between">
            <Link
              href="/history"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← ゲーム履歴に戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}