import { Module } from '@nestjs/common';
import { CalculatorsController } from './calculators.controller';
import { CalculatorsService } from './calculators.service';
import { FormulaEngine } from './engines/formula.engine';

// Bootstrap: importing this file triggers auto-registration of all calculators
// into the singleton CalculatorRegistry via side-effect imports.
import './engines/calculators/index';

@Module({
  controllers: [CalculatorsController],
  providers: [CalculatorsService, FormulaEngine],
  exports: [CalculatorsService, FormulaEngine],
})
export class CalculatorsModule {}
