import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CalculateDto {
  @ApiProperty({ example: 'egfr', description: 'Calculator identifier' })
  @IsString()
  @IsNotEmpty()
  calculatorId: string;

  @ApiProperty({
    example: { creatinine: 1.2, age: 45, sex: 'male' },
    description: 'Key-value map of input field IDs to their values',
  })
  @IsObject()
  inputs: Record<string, any>;

  @ApiPropertyOptional({
    example: { creatinine: 'mg/dL', height: 'cm', weight: 'kg' },
    description: 'Active unit for each field (if not provided, defaults are used)',
  })
  @IsOptional()
  @IsObject()
  units?: Record<string, string>;

  @ApiPropertyOptional({ example: 'ckd-epi', description: 'Formula variant to use' })
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiPropertyOptional({ description: 'Session ID for history tracking' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class BatchCalculateDto {
  @ApiProperty({ type: [CalculateDto], description: 'Array of calculations to perform' })
  calculations: CalculateDto[];
}
