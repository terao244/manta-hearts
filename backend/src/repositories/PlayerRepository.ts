import { PrismaClient, Player } from '@prisma/client';
import { PrismaService } from '../services/PrismaService';
import { IPlayerRepository } from './interfaces/IPlayerRepository';

export interface PlayerData {
  id: number;
  name: string;
  displayName: string;
  displayOrder: number;
  isActive: boolean;
}

export class PlayerRepository implements IPlayerRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance().getClient();
  }

  async findAll(activeOnly: boolean = true): Promise<PlayerData[]> {
    const where = activeOnly ? { isActive: true } : {};

    return await this.prisma.player.findMany({
      where,
      select: {
        id: true,
        name: true,
        displayName: true,
        displayOrder: true,
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }

  async findById(id: number): Promise<PlayerData | null> {
    return await this.prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        displayName: true,
        displayOrder: true,
        isActive: true,
      },
    });
  }

  async findByName(name: string): Promise<PlayerData | null> {
    return await this.prisma.player.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        displayName: true,
        displayOrder: true,
        isActive: true,
      },
    });
  }

  async create(data: Omit<PlayerData, 'id'>): Promise<PlayerData> {
    return await this.prisma.player.create({
      data,
      select: {
        id: true,
        name: true,
        displayName: true,
        displayOrder: true,
        isActive: true,
      },
    });
  }

  async update(
    id: number,
    data: Partial<Omit<PlayerData, 'id'>>
  ): Promise<PlayerData | null> {
    try {
      return await this.prisma.player.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          displayName: true,
          displayOrder: true,
          isActive: true,
        },
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return null; // Record not found
      }
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.player.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return false; // Record not found
      }
      throw error;
    }
  }

  async count(activeOnly: boolean = true): Promise<number> {
    const where = activeOnly ? { isActive: true } : {};
    return await this.prisma.player.count({ where });
  }
}
