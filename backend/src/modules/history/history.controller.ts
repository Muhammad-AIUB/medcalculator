import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { HistoryService } from './history.service';
import { CreateHistoryDto, HistoryQueryDto } from './dto/history.dto';

@ApiTags('history')
@Controller({ path: 'history', version: '1' })
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Save a calculation to history' })
  @ApiResponse({ status: 201, description: 'History entry created' })
  create(@Body() dto: CreateHistoryDto, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress;
    return this.historyService.create(dto, ip);
  }

  @Get()
  @ApiOperation({ summary: 'Get calculation history', description: 'Returns paginated calculation history, optionally filtered by calculatorId or sessionId' })
  @ApiResponse({ status: 200, description: 'History list returned' })
  findAll(@Query() query: HistoryQueryDto) {
    return this.historyService.findAll(query);
  }

  @Delete('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all history for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID to clear history for' })
  @ApiResponse({ status: 200, description: 'History cleared' })
  clearSession(@Param('sessionId') sessionId: string) {
    return this.historyService.deleteBySession(sessionId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a single history entry' })
  @ApiParam({ name: 'id', description: 'History entry UUID' })
  @ApiResponse({ status: 204, description: 'History entry deleted' })
  deleteOne(@Param('id') id: string) {
    return this.historyService.deleteOne(id);
  }
}
