import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHistoryDto {
  @ApiProperty({ example: 'egfr' })
  @IsString()
  @IsNotEmpty()
  calculatorId: string;

  @ApiProperty({ example: 'eGFR Calculator' })
  @IsString()
  @IsNotEmpty()
  calculatorName: string;

  @ApiProperty()
  @IsObject()
  inputs: Record<string, any>;

  @ApiProperty()
  @IsObject()
  outputs: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  units?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiProperty({ example: 'session-uuid' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class HistoryQueryDto {
  @ApiPropertyOptional({ example: 'egfr' })
  @IsOptional()
  @IsString()
  calculatorId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'session-uuid' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
