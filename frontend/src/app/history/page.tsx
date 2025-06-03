'use client';

import { useEffect, useState } from 'react';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import useGameHistory from '../../hooks/useGameHistory';
import GameCard from '../../components/ui/GameCard';

export default function GameHistoryPage() {
  // フィルター・ページング用の状態
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    sortBy: 'startTime',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  // ゲーム履歴データを取得
  const { games, isLoading, error, pagination, refetch } = useGameHistory(filters);

  useEffect(() => {
    document.title = 'ゲーム履歴 - Manta';
  }, []);

  // フィルター変更ハンドラー
  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handleSortChange = (sortValue: string) => {
    const [sortBy, sortOrder] = sortValue.split('-');
    setFilters(prev => ({ 
      ...prev, 
      sortBy, 
      sortOrder: sortOrder as 'asc' | 'desc',
      page: 1 
    }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // エラー時のリトライ
  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* ブレッドクラム */}
          <div className="mb-6">
            <Breadcrumbs 
              items={[
                { label: 'ホーム', href: '/' },
                { label: 'ゲーム履歴' }
              ]} 
            />
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ゲーム履歴</h1>
            <p className="text-gray-600">過去のハーツゲームの結果を確認できます</p>
          </div>

          {/* フィルター・ソートエリア */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ゲーム状況
                </label>
                <select 
                  value={filters.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="FINISHED">完了</option>
                  <option value="PLAYING">プレイ中</option>
                  <option value="PAUSED">一時停止</option>
                  <option value="ABANDONED">中断</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ソート順
                </label>
                <select 
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="startTime-desc">開始日時（新しい順）</option>
                  <option value="startTime-asc">開始日時（古い順）</option>
                  <option value="endTime-desc">終了日時（新しい順）</option>
                  <option value="endTime-asc">終了日時（古い順）</option>
                  <option value="duration-desc">ゲーム時間（長い順）</option>
                  <option value="duration-asc">ゲーム時間（短い順）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表示件数
                </label>
                <select 
                  value={filters.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                  <option value={50}>50件</option>
                </select>
              </div>
            </div>
          </div>

          {/* ゲーム一覧エリア */}
          <div className="space-y-4">
            {/* ローディング状態 */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">読み込み中...</p>
              </div>
            )}

            {/* エラー状態 */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  データの読み込みに失敗しました
                </h3>
                <p className="text-gray-500 mb-4">
                  {error.message}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  再試行
                </button>
              </div>
            )}

            {/* 空状態 */}
            {!isLoading && !error && games.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎮</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ゲーム履歴がありません
                </h3>
                <p className="text-gray-500">
                  ゲームをプレイすると、ここに履歴が表示されます
                </p>
              </div>
            )}

            {/* ゲーム一覧 */}
            {!isLoading && !error && games.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </div>

          {/* ページネーション */}
          {!isLoading && !error && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                
                {/* ページ番号 */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageNum === pagination.page
                          ? 'text-white bg-blue-600 border border-blue-600'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </nav>
            </div>
          )}

          {/* 検索結果情報 */}
          {!isLoading && !error && games.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}～
              {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
            </div>
          )}
        </div>
      </div>
    </div>
  );
}