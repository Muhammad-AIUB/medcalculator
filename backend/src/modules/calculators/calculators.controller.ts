import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CalculatorsService } from './calculators.service';
import { CalculateDto, BatchCalculateDto } from './dto/calculate.dto';
import { CalculationResultDto } from './dto/calculator-response.dto';

@ApiTags('calculators')
@Controller({ path: 'calculators', version: '1' })
export class CalculatorsController {
  constructor(private readonly calculatorsService: CalculatorsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'List all calculators', description: 'Returns metadata for all registered clinical calculators' })
  @ApiResponse({ status: 200, description: 'Calculator list returned successfully' })
  getAllCalculators() {
    return this.calculatorsService.getAllCalculators();
  }

  @Get('categories')
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'List calculator categories', description: 'Returns all categories with their calculators' })
  @ApiResponse({ status: 200, description: 'Categories returned successfully' })
  getCategories() {
    return this.calculatorsService.getCategories();
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'Get calculator metadata', description: 'Returns full metadata for a specific calculator including input definitions and validation rules' })
  @ApiParam({ name: 'id', example: 'egfr', description: 'Calculator identifier' })
  @ApiResponse({ status: 200, description: 'Calculator metadata returned' })
  @ApiResponse({ status: 404, description: 'Calculator not found' })
  getCalculator(@Param('id') id: string) {
    return this.calculatorsService.getCalculatorById(id);
  }

  @Post(':id/calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run a calculation', description: 'Executes a clinical calculator with the provided inputs and returns results with interpretations' })
  @ApiParam({ name: 'id', example: 'egfr', description: 'Calculator identifier' })
  @ApiResponse({ status: 200, type: CalculationResultDto, description: 'Calculation result with interpretations' })
  @ApiResponse({ status: 400, description: 'Invalid inputs' })
  @ApiResponse({ status: 404, description: 'Calculator not found' })
  calculate(@Param('id') id: string, @Body() dto: CalculateDto) {
    dto.calculatorId = id;
    return this.calculatorsService.calculate(dto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch calculations', description: 'Run multiple calculations in a single request' })
  @ApiResponse({ status: 200, type: [CalculationResultDto], description: 'Array of calculation results' })
  batchCalculate(@Body() dto: BatchCalculateDto) {
    return this.calculatorsService.batchCalculate(dto);
  }
}
