import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { CalculatorsModule } from './modules/calculators/calculators.module';
import { ConversionModule } from './modules/conversion/conversion.module';
import { HistoryModule } from './modules/history/history.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 20,
    }, {
      name: 'medium',
      ttl: 60000,
      limit: 200,
    }]),
    PrismaModule,
    CalculatorsModule,
    ConversionModule,
    HistoryModule,
    FavoritesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
