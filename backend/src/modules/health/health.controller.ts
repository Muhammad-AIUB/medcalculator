import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/database/prisma.service';

// Load balancers / uptime probes hit this constantly. Cache the DB ping for a
// few seconds so health traffic doesn't generate a DB round-trip per request.
const DB_PING_TTL_MS = 5000;

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  private dbStatusCache = { status: 'connected', checkedAt: 0 };

  private async getDbStatus(): Promise<string> {
    const now = Date.now();
    if (now - this.dbStatusCache.checkedAt < DB_PING_TTL_MS) {
      return this.dbStatusCache.status;
    }
    let status = 'connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      status = 'disconnected';
    }
    this.dbStatusCache = { status, checkedAt: now };
    return status;
  }

  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Returns system health status including database connectivity' })
  @ApiResponse({ status: 200, description: 'System healthy', schema: {
    example: { status: 'ok', timestamp: '2024-01-15T10:30:00.000Z', version: '1.0.0', services: { database: 'connected', api: 'running' } }
  }})
  async healthCheck() {
    const dbStatus = await this.getDbStatus();
    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      services: {
        database: dbStatus,
        api: 'running',
      },
    };
  }
}
