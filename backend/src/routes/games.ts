import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import Container from '../container/Container';
import { GameListQuery } from '../repositories/GameRepository';
import { GameStatus } from '@prisma/client';
import { HandCardRepository } from '../repositories/HandCardRepository';
import { CardExchangeRepository, CardExchangeWithRelations } from '../repositories/CardExchangeRepository';

const router = Router();
const container = Container.getInstance();

// GET /api/games - ゲーム一覧取得
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const gameRepository = container.getGameRepository();
    
    // クエリパラメータの解析と検証
    const query: GameListQuery = {};
    
    if (req.query.page) {
      const page = parseInt(req.query.page as string);
      if (isNaN(page) || page < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid page parameter',
        });
      }
      query.page = page;
    }
    
    if (req.query.limit) {
      const limit = parseInt(req.query.limit as string);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter (must be 1-100)',
        });
      }
      query.limit = limit;
    }
    
    if (req.query.status) {
      const status = req.query.status as string;
      if (!['PLAYING', 'FINISHED', 'PAUSED', 'ABANDONED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status parameter',
        });
      }
      query.status = status as GameStatus;
    }
    
    if (req.query.playerId) {
      const playerId = parseInt(req.query.playerId as string);
      if (isNaN(playerId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid playerId parameter',
        });
      }
      query.playerId = playerId;
    }
    
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy as string;
      if (!['startTime', 'endTime', 'duration'].includes(sortBy)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid sortBy parameter',
        });
      }
      query.sortBy = sortBy as 'startTime' | 'endTime' | 'duration';
    }
    
    if (req.query.sortOrder) {
      const sortOrder = req.query.sortOrder as string;
      if (!['asc', 'desc'].includes(sortOrder)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid sortOrder parameter',
        });
      }
      query.sortOrder = sortOrder as 'asc' | 'desc';
    }

    const result = await gameRepository.findAll(query);

    res.json({
      success: true,
      data: result.games,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        total: result.total,
        totalPages: Math.ceil(result.total / (query.limit || 10)),
      },
    });
  })
);

// GET /api/games/:id - 特定ゲーム詳細取得
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const gameId = parseInt(id);

    if (isNaN(gameId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game ID',
      });
    }

    const gameRepository = container.getGameRepository();
    const game = await gameRepository.findById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }

    res.json({
      success: true,
      data: game,
    });
  })
);

// GET /api/games/:id/hands/:handId/cards - 特定ハンドの全プレイヤー手札取得
router.get(
  '/:id/hands/:handId/cards',
  asyncHandler(async (req, res) => {
    const { id, handId } = req.params;
    const gameId = parseInt(id);
    const handIdNum = parseInt(handId);

    if (isNaN(gameId) || isNaN(handIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game ID or hand ID',
      });
    }

    // ゲームが存在するかチェック
    const gameRepository = container.getGameRepository();
    const game = await gameRepository.findById(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }

    // ハンドが存在するかチェック
    const handExists = game.hands.some(hand => hand.id === handIdNum);
    if (!handExists) {
      return res.status(404).json({
        success: false,
        error: 'Hand not found',
      });
    }

    const handCardRepository = new HandCardRepository();
    const handCards = await handCardRepository.findByHandId(handIdNum);

    // プレイヤー別にグループ化
    const playerCards: Record<number, any[]> = {};
    handCards.forEach(handCard => {
      if (!playerCards[handCard.playerId]) {
        playerCards[handCard.playerId] = [];
      }
      playerCards[handCard.playerId].push({
        id: handCard.card.id,
        suit: handCard.card.suit,
        rank: handCard.card.rank,
        code: handCard.card.code,
        pointValue: handCard.card.pointValue,
        sortOrder: handCard.card.sortOrder,
      });
    });

    res.json({
      success: true,
      data: {
        handId: handIdNum,
        playerCards,
      },
    });
  })
);

// GET /api/games/:id/hands/:handId/exchanges - 特定ハンドのカード交換履歴取得
router.get(
  '/:id/hands/:handId/exchanges',
  asyncHandler(async (req, res) => {
    const { id, handId } = req.params;
    const gameId = parseInt(id);
    const handIdNum = parseInt(handId);

    if (isNaN(gameId) || isNaN(handIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game ID or hand ID',
      });
    }

    // ゲームが存在するかチェック
    const gameRepository = container.getGameRepository();
    const game = await gameRepository.findById(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }

    // ハンドが存在するかチェック
    const handExists = game.hands.some(hand => hand.id === handIdNum);
    if (!handExists) {
      return res.status(404).json({
        success: false,
        error: 'Hand not found',
      });
    }

    const cardExchangeRepository = new CardExchangeRepository();
    const exchanges = await cardExchangeRepository.findByHandId(handIdNum);

    // 交換データを整理
    const exchangeData = exchanges.map((exchange: CardExchangeWithRelations) => ({
      id: exchange.id,
      fromPlayer: {
        id: exchange.fromPlayer.id,
        name: exchange.fromPlayer.displayName,
      },
      toPlayer: {
        id: exchange.toPlayer.id,
        name: exchange.toPlayer.displayName,
      },
      card: {
        id: exchange.card.id,
        suit: exchange.card.suit,
        rank: exchange.card.rank,
        code: exchange.card.code,
        pointValue: exchange.card.pointValue,
      },
      exchangeOrder: exchange.exchangeOrder,
    }));

    res.json({
      success: true,
      data: {
        handId: handIdNum,
        exchanges: exchangeData,
      },
    });
  })
);

export default router;