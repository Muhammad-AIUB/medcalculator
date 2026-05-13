import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AddFavoriteDto } from './dto/favorites.dto';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async add(dto: AddFavoriteDto) {
    // Upsert user first (session-based)
    await this.prisma.user.upsert({
      where: { sessionId: dto.userId },
      create: { sessionId: dto.userId },
      update: {},
    });
    // upsert guarantees the row exists — safe to assert non-null
    const user = await this.prisma.user.findUniqueOrThrow({ where: { sessionId: dto.userId } });
    return this.prisma.favorite.upsert({
      where: { userId_calculatorId: { userId: user.id, calculatorId: dto.calculatorId } },
      create: { userId: user.id, calculatorId: dto.calculatorId, pinnedOrder: dto.pinnedOrder },
      update: { pinnedOrder: dto.pinnedOrder },
    });
  }

  async findByUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { sessionId: userId } });
    if (!user) return [];
    return this.prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: [{ pinnedOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async remove(userId: string, calculatorId: string) {
    const user = await this.prisma.user.findUnique({ where: { sessionId: userId } });
    if (!user) return { deleted: 0 };
    const result = await this.prisma.favorite.deleteMany({
      where: { userId: user.id, calculatorId },
    });
    return { deleted: result.count };
  }
}
