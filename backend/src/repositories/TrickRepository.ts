import { Trick } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';
import { ITrickRepository, TrickData } from './interfaces/ITrickRepository';

export class TrickRepository implements ITrickRepository {
  private prismaService: PrismaService;

  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  async createTrick(handId: number, trickData: TrickData): Promise<Trick> {
    const prisma = this.prismaService.getClient();
    
    return prisma.trick.create({
      data: {
        handId,
        trickNumber: trickData.trickNumber,
        winnerPlayerId: trickData.winnerPlayerId,
        points: trickData.points,
        leadPlayerId: trickData.leadPlayerId,
      },
      include: {
        winner: true,
        leadPlayer: true,
        trickCards: {
          include: {
            player: true,
            card: true,
          },
          orderBy: { playOrder: 'asc' },
        },
      },
    });
  }

  async findByHandId(handId: number): Promise<Trick[]> {
    const prisma = this.prismaService.getClient();
    
    return prisma.trick.findMany({
      where: { handId },
      include: {
        winner: true,
        leadPlayer: true,
        trickCards: {
          include: {
            player: true,
            card: true,
          },
          orderBy: { playOrder: 'asc' },
        },
      },
      orderBy: { trickNumber: 'asc' },
    });
  }

  async findByHandIdAndTrickNumber(handId: number, trickNumber: number): Promise<Trick | null> {
    const prisma = this.prismaService.getClient();
    
    return prisma.trick.findUnique({
      where: {
        handId_trickNumber: {
          handId,
          trickNumber,
        },
      },
      include: {
        winner: true,
        leadPlayer: true,
        trickCards: {
          include: {
            player: true,
            card: true,
          },
          orderBy: { playOrder: 'asc' },
        },
      },
    });
  }

  async updateTrick(trickId: number, updates: Partial<TrickData>): Promise<Trick> {
    const prisma = this.prismaService.getClient();
    
    return prisma.trick.update({
      where: { id: trickId },
      data: updates,
      include: {
        winner: true,
        leadPlayer: true,
        trickCards: {
          include: {
            player: true,
            card: true,
          },
          orderBy: { playOrder: 'asc' },
        },
      },
    });
  }
}