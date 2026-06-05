import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AddFavoriteDto } from './dto/favorites.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(dto: AddFavoriteDto) {
    // Upsert returns the user row, so there's no need for a follow-up lookup.
    const user = await this.prisma.user.upsert({
      where: { sessionId: dto.userId },
      create: { sessionId: dto.userId },
      update: {},
      select: { id: true },
    });
    return this.prisma.favorite.upsert({
      where: { userId_calculatorId: { userId: user.id, calculatorId: dto.calculatorId } },
      create: { userId: user.id, calculatorId: dto.calculatorId, pinnedOrder: dto.pinnedOrder },
      update: { pinnedOrder: dto.pinnedOrder },
    });
  }

  async findByUser(userId: string) {
    // Single query: filter favorites by the related user's sessionId (JOIN),
    // instead of a separate user lookup followed by a favorites query.
    return this.prisma.favorite.findMany({
      where: { user: { sessionId: userId } },
      orderBy: [{ pinnedOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async remove(userId: string, calculatorId: string) {
    // Single query: delete via the user relation filter, no prior lookup needed.
    const result = await this.prisma.favorite.deleteMany({
      where: { calculatorId, user: { sessionId: userId } },
    });
    return { deleted: result.count };
  }
}
