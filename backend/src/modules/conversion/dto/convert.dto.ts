import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ConvertDto {
  @ApiProperty({ example: 1.2, description: 'Value to convert' })
  @IsNumber()
  value: number;

  @ApiProperty({ example: 'mg/dL', description: 'Source unit symbol' })
  @IsString()
  @IsNotEmpty()
  fromUnit: string;

  @ApiProperty({ example: 'µmol/L', description: 'Target unit symbol' })
  @IsString()
  @IsNotEmpty()
  toUnit: string;

  @ApiPropertyOptional({ example: 'creatinine', description: 'Substance name for molar mass conversions' })
  @IsOptional()
  @IsString()
  substance?: string;
}

export class ConvertAllDto {
  @ApiProperty({ example: 1.2 })
  @IsNumber()
  value: number;

  @ApiProperty({ example: 'mg/dL' })
  @IsString()
  @IsNotEmpty()
  fromUnit: string;

  @ApiPropertyOptional({ example: 'creatinine' })
  @IsOptional()
  @IsString()
  substance?: string;
}

export class ConversionResultDto {
  @ApiProperty({ example: 1.2 })
  originalValue: number;

  @ApiProperty({ example: 'mg/dL' })
  originalUnit: string;

  @ApiProperty({ example: 106.1 })
  convertedValue: number;

  @ApiProperty({ example: 'µmol/L' })
  convertedUnit: string;

  @ApiPropertyOptional({ example: 'creatinine' })
  substance?: string;
}

export class ConvertAllResultDto {
  @ApiProperty({ example: 1.2 })
  originalValue: number;

  @ApiProperty({ example: 'mg/dL' })
  originalUnit: string;

  @ApiProperty({ example: { 'mg/dL': 1.2, 'µmol/L': 106.1, 'mmol/L': 0.106 } })
  allValues: Record<string, number>;
}
