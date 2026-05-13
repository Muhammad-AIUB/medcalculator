import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({ example: 'egfr' })
  @IsString()
  @IsNotEmpty()
  calculatorId: string;

  @ApiProperty({ example: 'user-session-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  pinnedOrder?: number;
}

export class RemoveFavoriteDto {
  @ApiProperty({ example: 'user-session-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
