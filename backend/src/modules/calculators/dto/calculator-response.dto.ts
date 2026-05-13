import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InterpretationDto {
  @ApiProperty({ example: 'Stage G2 - Mildly decreased kidney function' })
  text: string;

  @ApiProperty({ example: 'warning', enum: ['success', 'warning', 'danger', 'info', 'neutral'] })
  severity: 'success' | 'warning' | 'danger' | 'info' | 'neutral';

  @ApiPropertyOptional({ example: '#f59e0b' })
  color?: string;

  @ApiPropertyOptional({ example: 'Consult nephrology if persistent < 60 mL/min/1.73m²' })
  clinicalNote?: string;

  @ApiPropertyOptional({ example: 'CKD Stage G2' })
  classification?: string;
}

export class CalculationOutputDto {
  @ApiProperty({ example: 'egfr' })
  id: string;

  @ApiProperty({ example: 'eGFR' })
  label: string;

  @ApiProperty({ example: 75.4 })
  value: number | string;

  @ApiPropertyOptional({ example: 'mL/min/1.73m²' })
  unit?: string;

  @ApiProperty()
  interpretation: InterpretationDto;

  @ApiPropertyOptional({ description: 'All unit equivalents of this output value' })
  allUnits?: Record<string, number>;
}

export class CalculationResultDto {
  @ApiProperty({ example: 'egfr' })
  calculatorId: string;

  @ApiProperty({ example: 'eGFR Calculator' })
  calculatorName: string;

  @ApiProperty({ type: [CalculationOutputDto] })
  outputs: CalculationOutputDto[];

  @ApiProperty({ description: 'Echo of the input values used' })
  inputs: Record<string, any>;

  @ApiProperty({ description: 'Active units used for calculation' })
  units: Record<string, string>;

  @ApiPropertyOptional({ example: 'CKD-EPI 2021' })
  formulaUsed?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  calculatedAt: string;

  @ApiPropertyOptional({ description: 'Clinical warnings or alerts' })
  warnings?: string[];

  @ApiPropertyOptional({ description: 'Reference citations' })
  references?: string[];
}
