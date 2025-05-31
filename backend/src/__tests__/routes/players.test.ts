import request from 'supertest';
import { app } from '../../server';
import { PlayerRepository } from '../../repositories/PlayerRepository';

// PlayerRepositoryをモック化
jest.mock('../../repositories/PlayerRepository', () => {
  return {
    PlayerRepository: jest.fn(),
  };
});

describe('Players API', () => {
  let mockPlayerRepository: {
    findAll: jest.MockedFunction<(activeOnly?: boolean) => Promise<any[]>>;
    findById: jest.MockedFunction<(id: number) => Promise<any>>;
    findByName: jest.MockedFunction<(name: string) => Promise<any>>;
    create: jest.MockedFunction<(data: any) => Promise<any>>;
    update: jest.MockedFunction<(id: number, data: any) => Promise<any>>;
    delete: jest.MockedFunction<(id: number) => Promise<boolean>>;
    count: jest.MockedFunction<(activeOnly?: boolean) => Promise<number>>;
  };

  const mockPlayers = [
    {
      id: 1,
      name: 'North',
      displayName: '北',
      displayOrder: 1,
      isActive: true,
    },
    { id: 2, name: 'East', displayName: '東', displayOrder: 2, isActive: true },
    {
      id: 3,
      name: 'South',
      displayName: '南',
      displayOrder: 3,
      isActive: true,
    },
    { id: 4, name: 'West', displayName: '西', displayOrder: 4, isActive: true },
  ];

  beforeEach(() => {
    mockPlayerRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    (
      PlayerRepository as jest.MockedClass<typeof PlayerRepository>
    ).mockImplementation(() => ({
      ...mockPlayerRepository,
    } as unknown as PlayerRepository));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/players', () => {
    it('should return all active players', async () => {
      mockPlayerRepository.findAll.mockResolvedValue(mockPlayers);

      const response = await request(app).get('/api/players').expect(200);

      expect(mockPlayerRepository.findAll).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data', mockPlayers);
      expect(response.body).toHaveProperty('count', mockPlayers.length);
    });

    it('should return players ordered by displayOrder', async () => {
      mockPlayerRepository.findAll.mockResolvedValue(mockPlayers);

      const response = await request(app).get('/api/players').expect(200);

      const players = response.body.data;
      for (let i = 1; i < players.length; i++) {
        expect(players[i].displayOrder).toBeGreaterThanOrEqual(
          players[i - 1].displayOrder
        );
      }
    });
  });

  describe('GET /api/players/:id', () => {
    it('should return a specific player', async () => {
      const testPlayer = mockPlayers[0];
      mockPlayerRepository.findById.mockResolvedValue(testPlayer);

      const response = await request(app)
        .get(`/api/players/${testPlayer.id}`)
        .expect(200);

      expect(mockPlayerRepository.findById).toHaveBeenCalledWith(testPlayer.id);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data', testPlayer);
    });

    it('should return 404 for non-existent player', async () => {
      mockPlayerRepository.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/players/99999').expect(404);

      expect(mockPlayerRepository.findById).toHaveBeenCalledWith(99999);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Player not found');
    });

    it('should return 400 for invalid player ID', async () => {
      const response = await request(app)
        .get('/api/players/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid player ID');
    });
  });
});
