import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import Container from '../container/Container';
import { GameListQuery } from '../repositories/GameRepository';
import { GameStatus } from '@prisma/client';

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

export default router;