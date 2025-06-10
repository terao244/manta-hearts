import request from 'supertest';
import { app } from '../../server';
import Container from '../../container/Container';
import { MockGameRepository, createMockGameRepository } from '../../helpers/mockHelpers';
import { GameStatus } from '@prisma/client';

describe('Games API', () => {
  let mockGameRepository: MockGameRepository;
  let container: Container;

  const mockGames = [
    {
      id: 1,
      startTime: new Date('2025-06-01T10:00:00Z'),
      endTime: new Date('2025-06-01T10:30:00Z'),
      status: GameStatus.FINISHED,
      winnerId: 1,
      winnerName: '北',
      duration: 30,
      playerCount: 4,
      finalScores: [
        { playerId: 1, playerName: '北', score: 15 },
        { playerId: 2, playerName: '東', score: 25 },
        { playerId: 3, playerName: '南', score: 30 },
        { playerId: 4, playerName: '西', score: 30 },
      ],
    },
    {
      id: 2,
      startTime: new Date('2025-06-01T11:00:00Z'),
      endTime: null,
      status: GameStatus.PLAYING,
      winnerId: null,
      winnerName: null,
      duration: null,
      playerCount: 4,
      finalScores: [
        { playerId: 1, playerName: '北', score: 10 },
        { playerId: 2, playerName: '東', score: 8 },
        { playerId: 3, playerName: '南', score: 12 },
        { playerId: 4, playerName: '西', score: 6 },
      ],
    },
  ];

  // JSON serialization用のexpected data
  const expectedGames = [
    {
      id: 1,
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T10:30:00.000Z',
      status: 'FINISHED',
      winnerId: 1,
      winnerName: '北',
      duration: 30,
      playerCount: 4,
      finalScores: [
        { playerId: 1, playerName: '北', score: 15 },
        { playerId: 2, playerName: '東', score: 25 },
        { playerId: 3, playerName: '南', score: 30 },
        { playerId: 4, playerName: '西', score: 30 },
      ],
    },
    {
      id: 2,
      startTime: '2025-06-01T11:00:00.000Z',
      endTime: null,
      status: 'PLAYING',
      winnerId: null,
      winnerName: null,
      duration: null,
      playerCount: 4,
      finalScores: [
        { playerId: 1, playerName: '北', score: 10 },
        { playerId: 2, playerName: '東', score: 8 },
        { playerId: 3, playerName: '南', score: 12 },
        { playerId: 4, playerName: '西', score: 6 },
      ],
    },
  ];

  const mockGameDetail = {
    id: 1,
    startTime: new Date('2025-06-01T10:00:00Z'),
    endTime: new Date('2025-06-01T10:30:00Z'),
    status: GameStatus.FINISHED,
    winnerId: 1,
    winnerName: '北',
    duration: 30,
    playerCount: 4,
    finalScores: [
      { playerId: 1, playerName: '北', score: 15 },
      { playerId: 2, playerName: '東', score: 25 },
      { playerId: 3, playerName: '南', score: 30 },
      { playerId: 4, playerName: '西', score: 30 },
    ],
    players: [
      { id: 1, name: '北', position: 'North' as const, finalScore: 15 },
      { id: 2, name: '東', position: 'East' as const, finalScore: 25 },
      { id: 3, name: '南', position: 'South' as const, finalScore: 30 },
      { id: 4, name: '西', position: 'West' as const, finalScore: 30 },
    ],
    scoreHistory: [
      { hand: 1, scores: { 1: 15, 2: 25, 3: 30, 4: 30 } },
    ],
    hands: [
      {
        id: 1,
        handNumber: 1,
        exchangeDirection: 'left' as const,
        heartsBroken: true,
        shootTheMoonPlayerId: null,
        shootTheMoonPlayerName: null,
        scores: { 1: 5, 2: 10 },
        tricks: [
          {
            id: 1,
            trickNumber: 1,
            handNumber: 1,
            winnerId: 1,
            leadPlayerId: 1,
            points: 2,
            cards: [
              {
                playerId: 1,
                card: {
                  id: 1,
                  suit: 'CLUBS' as const,
                  rank: 'TWO' as const,
                  code: '2C',
                  pointValue: 0,
                  sortOrder: 2,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  const expectedGameDetail = {
    id: 1,
    startTime: '2025-06-01T10:00:00.000Z',
    endTime: '2025-06-01T10:30:00.000Z',
    status: 'FINISHED',
    winnerId: 1,
    winnerName: '北',
    duration: 30,
    playerCount: 4,
    finalScores: [
      { playerId: 1, playerName: '北', score: 15 },
      { playerId: 2, playerName: '東', score: 25 },
      { playerId: 3, playerName: '南', score: 30 },
      { playerId: 4, playerName: '西', score: 30 },
    ],
    players: [
      { id: 1, name: '北', position: 'North', finalScore: 15 },
      { id: 2, name: '東', position: 'East', finalScore: 25 },
      { id: 3, name: '南', position: 'South', finalScore: 30 },
      { id: 4, name: '西', position: 'West', finalScore: 30 },
    ],
    scoreHistory: [
      { hand: 1, scores: { '1': 15, '2': 25, '3': 30, '4': 30 } },
    ],
    hands: [
      {
        id: 1,
        handNumber: 1,
        exchangeDirection: 'left',
        heartsBroken: true,
        shootTheMoonPlayerId: null,
        shootTheMoonPlayerName: null,
        scores: { 1: 5, 2: 10 },
        tricks: [
          {
            id: 1,
            trickNumber: 1,
            handNumber: 1,
            winnerId: 1,
            leadPlayerId: 1,
            points: 2,
            cards: [
              {
                playerId: 1,
                card: {
                  id: 1,
                  suit: 'CLUBS' as const,
                  rank: 'TWO' as const,
                  code: '2C',
                  pointValue: 0,
                  sortOrder: 2,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    container = Container.getInstance();
    mockGameRepository = createMockGameRepository();
    container.setGameRepository(mockGameRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    container.reset();
  });

  describe('GET /api/games', () => {
    it('should return games list with default pagination', async () => {
      mockGameRepository.findAll.mockResolvedValue({
        games: mockGames,
        total: 2,
      });

      const response = await request(app).get('/api/games').expect(200);

      expect(mockGameRepository.findAll).toHaveBeenCalledWith({});
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data', expectedGames);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('should return games list with custom pagination', async () => {
      mockGameRepository.findAll.mockResolvedValue({
        games: [mockGames[0]],
        total: 2,
      });

      const response = await request(app)
        .get('/api/games?page=2&limit=1')
        .expect(200);

      expect(mockGameRepository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 1,
      });
      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 1,
        total: 2,
        totalPages: 2,
      });
    });

    it('should filter games by status', async () => {
      mockGameRepository.findAll.mockResolvedValue({
        games: [mockGames[1]],
        total: 1,
      });

      const response = await request(app)
        .get('/api/games?status=PLAYING')
        .expect(200);

      expect(mockGameRepository.findAll).toHaveBeenCalledWith({
        status: GameStatus.PLAYING,
      });
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('PLAYING');
    });

    it('should filter games by playerId', async () => {
      mockGameRepository.findAll.mockResolvedValue({
        games: mockGames,
        total: 2,
      });

      const response = await request(app)
        .get('/api/games?playerId=1')
        .expect(200);

      expect(mockGameRepository.findAll).toHaveBeenCalledWith({
        playerId: 1,
      });
    });

    it('should sort games by sortBy and sortOrder', async () => {
      mockGameRepository.findAll.mockResolvedValue({
        games: mockGames,
        total: 2,
      });

      const response = await request(app)
        .get('/api/games?sortBy=endTime&sortOrder=asc')
        .expect(200);

      expect(mockGameRepository.findAll).toHaveBeenCalledWith({
        sortBy: 'endTime',
        sortOrder: 'asc',
      });
    });

    it('should return 400 for invalid page parameter', async () => {
      const response = await request(app).get('/api/games?page=0').expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid page parameter');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/games?limit=101')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'Invalid limit parameter (must be 1-100)'
      );
    });

    it('should return 400 for invalid status parameter', async () => {
      const response = await request(app)
        .get('/api/games?status=INVALID')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid status parameter');
    });

    it('should return 400 for invalid sortBy parameter', async () => {
      const response = await request(app)
        .get('/api/games?sortBy=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid sortBy parameter');
    });

    it('should return 400 for invalid sortOrder parameter', async () => {
      const response = await request(app)
        .get('/api/games?sortOrder=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid sortOrder parameter');
    });
  });

  describe('GET /api/games/:id', () => {
    it('should return a specific game detail', async () => {
      mockGameRepository.findById.mockResolvedValue(mockGameDetail);

      const response = await request(app).get('/api/games/1').expect(200);

      expect(mockGameRepository.findById).toHaveBeenCalledWith(1);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data', expectedGameDetail);
    });

    it('should return 404 for non-existent game', async () => {
      mockGameRepository.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/games/99999').expect(404);

      expect(mockGameRepository.findById).toHaveBeenCalledWith(99999);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Game not found');
    });

    it('should return 400 for invalid game ID', async () => {
      const response = await request(app).get('/api/games/invalid').expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid game ID');
    });
  });
});