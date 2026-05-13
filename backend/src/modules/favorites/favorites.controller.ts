import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/favorites.dto';

@ApiTags('favorites')
@Controller({ path: 'favorites', version: '1' })
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: 'Add calculator to favorites' })
  @ApiResponse({ status: 201, description: 'Favorite added' })
  add(@Body() dto: AddFavoriteDto) {
    return this.favoritesService.add(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiQuery({ name: 'userId', description: 'Session-based user ID', required: true })
  @ApiResponse({ status: 200, description: 'Favorites list' })
  findAll(@Query('userId') userId: string) {
    return this.favoritesService.findByUser(userId);
  }

  @Delete(':calculatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove calculator from favorites' })
  @ApiParam({ name: 'calculatorId', example: 'egfr' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiResponse({ status: 200, description: 'Favorite removed' })
  remove(@Param('calculatorId') calculatorId: string, @Query('userId') userId: string) {
    return this.favoritesService.remove(userId, calculatorId);
  }
}
