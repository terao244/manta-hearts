'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* ロゴ */}
            <Link href="/" className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                🂡 Manta
              </div>
            </Link>

            {/* ナビゲーションメニュー */}
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                ゲーム
              </Link>
              
              <Link
                href="/history"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/history')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                履歴
              </Link>
            </div>
          </div>

          {/* 右側のメニュー */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              4人対戦ハーツゲーム
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}