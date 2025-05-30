import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { PlayerRepository } from '../repositories/PlayerRepository';

const router = Router();
const playerRepository = new PlayerRepository();

// GET /api/players - 全プレイヤー一覧取得
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const players = await playerRepository.findAll();

    res.json({
      success: true,
      data: players,
      count: players.length,
    });
  })
);

// GET /api/players/:id - 特定プレイヤー情報取得
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const playerId = parseInt(id);

    if (isNaN(playerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid player ID',
      });
    }

    const player = await playerRepository.findById(playerId);

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }

    res.json({
      success: true,
      data: player,
    });
  })
);

export default router;
