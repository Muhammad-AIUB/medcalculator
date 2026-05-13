import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateHistoryDto, HistoryQueryDto } from './dto/history.dto';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHistoryDto, ipAddress?: string) {
    try {
      return await this.prisma.calculationHistory.create({
        data: {
          calculatorId: dto.calculatorId,
          calculatorName: dto.calculatorName,
          inputs: dto.inputs,
          outputs: dto.outputs,
          units: dto.units ?? {},
          formula: dto.formula,
          sessionId: dto.sessionId,
          ipAddress,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to save history: ${err.message}`);
      throw err;
    }
  }

  async findAll(query: HistoryQueryDto) {
    const { page = 1, limit = 20, calculatorId, sessionId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (calculatorId) where.calculatorId = calculatorId;
    if (sessionId) where.sessionId = sessionId;

    const [items, total] = await Promise.all([
      this.prisma.calculationHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          calculatorId: true,
          calculatorName: true,
          inputs: true,
          outputs: true,
          units: true,
          formula: true,
          sessionId: true,
          createdAt: true,
        },
      }),
      this.prisma.calculationHistory.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async deleteOne(id: string) {
    return this.prisma.calculationHistory.delete({ where: { id } });
  }

  async deleteBySession(sessionId: string) {
    const result = await this.prisma.calculationHistory.deleteMany({ where: { sessionId } });
    return { deleted: result.count };
  }
}
