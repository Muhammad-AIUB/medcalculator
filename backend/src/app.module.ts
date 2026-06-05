import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    // Async so it reads env-driven limits from ConfigService (forRoot would
    // evaluate before config is loaded). Tune via THROTTLE_* env vars.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: config.get<number>('throttle.short.ttl', 1000),
          limit: config.get<number>('throttle.short.limit', 50),
        },
        {
          name: 'medium',
          ttl: config.get<number>('throttle.medium.ttl', 60000),
          limit: config.get<number>('throttle.medium.limit', 1000),
        },
      ],
    }),
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
