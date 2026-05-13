import { Module } from '@nestjs/common';
import { ConversionController } from './conversion.controller';
import { ConversionService } from './conversion.service';
import { UnitNormalizer } from './engine/unit.normalizer';
import { ConversionRegistryService } from './engine/conversion-registry.service';

@Module({
  controllers: [ConversionController],
  providers: [ConversionService, UnitNormalizer, ConversionRegistryService],
  exports: [ConversionService, UnitNormalizer, ConversionRegistryService],
})
export class ConversionModule {}
