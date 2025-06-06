'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import { useGameDetail } from '../../../hooks/useGameDetail';
import { GameDetailData, HandDetailData, CardInfo } from '../../../types';
import { ScoreGraph } from '../../../components/game/ScoreGraph';
import { formatCardFromInfo, getCardColorClass } from '../../../utils/cardFormatting';
import { fetchHandCardsWithRetry, fetchHandExchangesWithRetry, CardExchange } from '../../../lib/api/games';
import HandHistory from '../../../components/history/HandHistory';
import CardExchangeHistory from '../../../components/history/CardExchangeHistory';

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const { game: gameDetail, isLoading, error, refetch } = useGameDetail(Number(gameId));

  useEffect(() => {
    document.title = `ゲーム詳細 #${gameId} - Manta`;
  }, [gameId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="mb-4">
              <Link href="/history" className="text-blue-600 hover:text-blue-800">
                ← ゲーム履歴に戻る
              </Link>
            </div>
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">ゲーム詳細を読み込み中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="mb-4">
              <Link href="/history" className="text-blue-600 hover:text-blue-800">
                ← ゲーム履歴に戻る
              </Link>
            </div>
            <div className="text-center py-20">
              <div className="text-red-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ゲーム詳細の読み込みに失敗しました</h3>
              <p className="text-gray-600 mb-4">{error.message}</p>
              <button
                onClick={refetch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="mb-4">
              <Link href="/history" className="text-blue-600 hover:text-blue-800">
                ← ゲーム履歴に戻る
              </Link>
            </div>
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-gray-900">ゲームが見つかりませんでした</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          {/* ブレッドクラム */}
          <div className="mb-4">
            <Breadcrumbs
              items={[
                { label: 'ホーム', href: '/' },
                { label: 'ゲーム履歴', href: '/history' },
                { label: `ゲーム #${gameId}` }
              ]}
            />
          </div>

          <div className="space-y-4">
            {/* ゲーム基本情報 */}
            <GameBasicInfo gameDetail={gameDetail} />

            {/* スコア推移グラフ */}
            <ScoreGraphSection gameDetail={gameDetail} />

            {/* ハンド履歴 */}
            <HandHistorySection gameDetail={gameDetail} />
          </div>

          {/* 戻るボタン */}
          <div className="mt-8 flex justify-between">
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

function GameBasicInfo({ gameDetail }: { gameDetail: GameDetailData }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}時間${mins}分`;
    }
    return `${mins}分`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'FINISHED': return '完了';
      case 'PLAYING': return 'プレイ中';
      case 'PAUSED': return '一時停止';
      case 'ABANDONED': return '中断';
      default: return status;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'FINISHED': return 'bg-green-100 text-green-800';
      case 'PLAYING': return 'bg-blue-100 text-blue-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'ABANDONED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 最終スコアから勝者を決定
  const winner = gameDetail.players?.length > 0
    ? gameDetail.players.reduce((min, player) =>
      player.finalScore < min.finalScore ? player : min
    )
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">ゲーム #{gameDetail.id}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(gameDetail.status)}`}>
            {getStatusText(gameDetail.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ゲーム基本情報 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ゲーム情報</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">開始日時:</dt>
              <dd className="text-gray-900">{formatDate(gameDetail.startTime)}</dd>
            </div>
            {gameDetail.endTime && (
              <div className="flex justify-between">
                <dt className="text-gray-600">終了日時:</dt>
                <dd className="text-gray-900">{formatDate(gameDetail.endTime)}</dd>
              </div>
            )}
            {gameDetail.duration && (
              <div className="flex justify-between">
                <dt className="text-gray-600">ゲーム時間:</dt>
                <dd className="text-gray-900">{formatDuration(gameDetail.duration)}</dd>
              </div>
            )}
            {gameDetail.status === 'FINISHED' && winner && (
              <div className="flex justify-between">
                <dt className="text-gray-600">勝者:</dt>
                <dd className="text-green-600 font-semibold">{winner.name}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* プレイヤー最終結果 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最終結果</h2>
          <div className="space-y-2">
            {gameDetail.players && gameDetail.players.length > 0 ? (
              gameDetail.players
                .sort((a, b) => a.finalScore - b.finalScore)
                .map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className={`font-bold ${index === 0 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                      {player.finalScore}点
                    </span>
                  </div>
                ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                プレイヤー情報がありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreGraphSection({ gameDetail }: { gameDetail: GameDetailData }) {
  // スコア履歴をScoreGraphに渡すための形式に変換
  const scoreHistory = gameDetail.scoreHistory?.map(entry => ({
    hand: entry.hand,
    scores: entry.scores,
  })) || [];

  // playersが空の場合はfinalScoresからプレイヤー情報を生成
  const players = gameDetail.players?.length > 0
    ? gameDetail.players.map(player => ({
      id: player.id,
      name: player.name,
      displayName: player.name,
      displayOrder: 1,
      isActive: true,
    }))
    : gameDetail.finalScores?.map(score => ({
      id: score.playerId,
      name: score.playerName,
      displayName: score.playerName,
      displayOrder: 1,
      isActive: true,
    })) || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">スコア推移</h2>
      {players.length > 0 && scoreHistory.length > 0 ? (
        <div className="h-80">
          <ScoreGraph
            players={players}
            scoreHistory={scoreHistory}
            currentPlayerId={players[0]?.id}
            height="100%"
          />
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          スコアデータがありません
        </div>
      )}
    </div>
  );
}

function HandHistorySection({ gameDetail }: { gameDetail: GameDetailData }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">ハンド履歴</h2>
      {!gameDetail.hands || gameDetail.hands.length === 0 ? (
        <p className="text-gray-600">ハンド履歴がありません。</p>
      ) : (
        <div className="space-y-4">
          {gameDetail.hands.map((hand) => (
            <HandDetail key={hand.handNumber} hand={hand} players={gameDetail.players || []} gameId={gameDetail.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function HandDetail({ hand, players, gameId }: { hand: HandDetailData; players: GameDetailData['players']; gameId: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [handCards, setHandCards] = useState<Record<number, CardInfo[]> | undefined>();
  const [exchanges, setExchanges] = useState<CardExchange[] | undefined>();
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingExchanges, setLoadingExchanges] = useState(false);
  const [cardsError, setCardsError] = useState<string | undefined>();
  const [exchangesError, setExchangesError] = useState<string | undefined>();

  const loadHandCards = async () => {
    setLoadingCards(true);
    setCardsError(undefined);
    try {
      const data = await fetchHandCardsWithRetry(gameId, hand.id);
      setHandCards(data.playerCards);
    } catch (error) {
      setCardsError(error instanceof Error ? error.message : '手札データの読み込みに失敗しました');
    } finally {
      setLoadingCards(false);
    }
  };

  const loadExchanges = async () => {
    setLoadingExchanges(true);
    setExchangesError(undefined);
    try {
      const data = await fetchHandExchangesWithRetry(gameId, hand.id);
      setExchanges(data.exchanges);
    } catch (error) {
      setExchangesError(error instanceof Error ? error.message : '交換データの読み込みに失敗しました');
    } finally {
      setLoadingExchanges(false);
    }
  };

  const getExchangeDirectionText = (direction: string) => {
    switch (direction) {
      case 'left': return '左隣';
      case 'right': return '右隣';
      case 'across': return '向かい';
      case 'none': return 'なし';
      default: return direction;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <span className="font-medium">ハンド {hand.handNumber}</span>
          <span className="text-sm text-gray-600">
            交換: {getExchangeDirectionText(hand.exchangeDirection)}
          </span>
          {hand.shootTheMoonPlayerId && (
            <span className="px-1 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">シュートザムーン</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          {/* 手札履歴 */}
          <div className="mt-3">
            <HandHistory
              gameId={gameId}
              handId={hand.id}
              handNumber={hand.handNumber}
              players={players.map(p => ({ id: p.id, name: p.name }))}
              playerCards={handCards}
              isLoading={loadingCards}
              error={cardsError}
              onLoadCards={loadHandCards}
            />
          </div>

          {/* カード交換履歴 */}
          <div className="mt-3">
            <CardExchangeHistory
              gameId={gameId}
              handId={hand.id}
              handNumber={hand.handNumber}
              exchangeDirection={hand.exchangeDirection}
              exchanges={exchanges}
              isLoading={loadingExchanges}
              error={exchangesError}
              onLoadExchanges={loadExchanges}
            />
          </div>

          {/* ハンドスコア */}
          <div className="mt-3">
            <h4 className="font-medium text-gray-900 mb-1">ハンドスコア</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {hand.scores && Object.entries(hand.scores).map(([playerId]) => {
                      const player = players.find(p => p.id === Number(playerId));
                      return (
                        <th key={playerId} className="border border-gray-300 px-1 py-0.5 text-center font-medium">
                          {player?.name || `P${playerId}`}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {hand.scores && Object.entries(hand.scores).map(([playerId, score]) => (
                      <td key={playerId} className="border border-gray-300 px-1 py-0.5 text-center font-medium">
                        {score}点
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* トリック一覧 */}
          {hand.tricks && hand.tricks.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-gray-900 mb-1">トリック詳細</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-1 py-0.5 text-left font-medium">T#</th>
                      <th className="border border-gray-300 px-1 py-0.5 text-left font-medium">リード</th>
                      <th className="border border-gray-300 px-1 py-0.5 text-left font-medium">カード</th>
                      <th className="border border-gray-300 px-1 py-0.5 text-left font-medium">勝者</th>
                      <th className="border border-gray-300 px-1 py-0.5 text-center font-medium">点数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hand.tricks.map((trick) => {
                      const leader = players.find(p => p.id === trick.leadPlayerId);
                      const winner = players.find(p => p.id === trick.winnerId);

                      return (
                        <tr key={trick.trickNumber} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-1 py-0.5 font-medium">{trick.trickNumber}</td>
                          <td className="border border-gray-300 px-1 py-0.5">{leader?.name || `P${trick.leadPlayerId}`}</td>
                          <td className="border border-gray-300 px-1 py-0.5">
                            <div className="flex flex-wrap gap-1">
                              {trick.cards && trick.cards.map((cardPlay, index) => {
                                if (!cardPlay.card) {
                                  return (
                                    <span key={index} className="text-red-400 text-xs">?</span>
                                  );
                                }

                                const cardDisplay = formatCardFromInfo(cardPlay.card);
                                const colorClass = getCardColorClass(cardDisplay.color);
                                const playerName = players.find(p => p.id === cardPlay.playerId)?.name || `P${cardPlay.playerId}`;
                                const isWinner = cardPlay.playerId === trick.winnerId;
                                const isLeader = cardPlay.playerId === trick.leadPlayerId;

                                return (
                                  <span
                                    key={`${cardPlay.card.suit}-${cardPlay.card.rank}`}
                                    className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium border ${isWinner
                                        ? 'bg-green-100 border-green-300 text-green-800'
                                        : 'bg-white border-gray-200'
                                      }`}
                                    title={`${playerName}${isLeader ? ' (リード)' : ''}${isWinner ? ' (勝者)' : ''}`}
                                  >
                                    <span className={`font-bold ${colorClass}`}>
                                      {cardDisplay.displayText}
                                    </span>
                                    <span className="ml-1 text-gray-600">
                                      {playerName.charAt(0)}
                                      {isLeader && '👑'}
                                      {isWinner && '🏆'}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 font-medium text-green-600">
                            {winner?.name || `P${trick.winnerId}`}
                          </td>
                          <td className="border border-gray-300 px-1 py-0.5 text-center font-medium">
                            {trick.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}