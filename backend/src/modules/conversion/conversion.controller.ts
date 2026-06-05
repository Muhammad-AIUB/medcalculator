import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConversionService } from './conversion.service';
import { ConvertDto, ConvertAllDto, ConversionResultDto, ConvertAllResultDto } from './dto/convert.dto';

@ApiTags('conversion')
@Controller({ path: 'conversion', version: '1' })
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert a single unit value', description: 'Convert a medical value from one unit to another' })
  @ApiResponse({ status: 200, type: ConversionResultDto })
  @ApiResponse({ status: 400, description: 'Invalid units or incompatible conversion' })
  convert(@Body() dto: ConvertDto): ConversionResultDto {
    return this.conversionService.convert(dto);
  }

  @Post('convert-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert to all equivalent units', description: 'Returns a value expressed in all supported units of the same category' })
  @ApiResponse({ status: 200, type: ConvertAllResultDto })
  convertAll(@Body() dto: ConvertAllDto): ConvertAllResultDto {
    return this.conversionService.convertAll(dto);
  }

  @Get('units')
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'List all supported units', description: 'Returns the complete registry of supported medical units' })
  @ApiResponse({ status: 200, description: 'Unit registry returned' })
  getAllUnits() {
    return this.conversionService.getAllUnits();
  }

  @Get('units/categories')
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'List unit categories', description: 'Returns all available unit categories' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  getCategories() {
    return this.conversionService.getCategories();
  }

  @Get('units/:category')
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'Get units by category' })
  @ApiParam({ name: 'category', example: 'concentration', enum: ['concentration', 'weight', 'length', 'pressure', 'rate', 'volume', 'temperature'] })
  @ApiResponse({ status: 200, description: 'Units for the given category' })
  getUnitsByCategory(@Param('category') category: string) {
    return this.conversionService.getUnitsByCategory(category);
  }
}
