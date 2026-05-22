import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SpotsService } from './spots.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { RejectEventDto } from '../events/dto/reject-event.dto';

// Spots: paid ads shown among the event cards. No detail view.
@ApiTags('spots')
@Controller('spots')
export class SpotsController {
  constructor(private readonly spots: SpotsService) {}

  @Get()
  @ApiOperation({ summary: 'List active spots (public)' })
  findActive() {
    return this.spots.findActive();
  }

  @Get('quota')
  @ApiOperation({ summary: 'Spot quota and per-day price' })
  quota() {
    return this.spots.quota();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List the current user's spots (any status)" })
  findMine(@CurrentUser() user: JwtUser) {
    return this.spots.findMine(user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a spot in DRAFT — add to an order to pay and publish' })
  create(@Body() dto: CreateSpotDto, @CurrentUser() user: JwtUser) {
    return this.spots.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a spot (owner or admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpotDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.spots.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a spot (owner or admin)' })
  @ApiBadRequestResponse({ description: 'Spot not found or access denied' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.spots.remove(id, user);
  }

  // ── Moderación (ADMIN+) ──

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar un aviso (ADMIN+)' })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.spots.approve(id, user, req);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar un aviso con motivo (ADMIN+)' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectEventDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.spots.reject(id, dto.reason, user, req);
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bannear un aviso con motivo (ADMIN+)' })
  ban(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectEventDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.spots.ban(id, dto.reason, user, req);
  }
}
