import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { HeroesService } from './heroes.service';
import { CreateHeroDto } from './dto/create-hero.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RejectEventDto } from '../events/dto/reject-event.dto';
import { OrgContextGuard } from '../common/org-context/org-context.guard';
import { OrgContext } from '../common/org-context/org-context.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';
import { QueryHeroesDto } from './dto/query-heroes.dto';

// Heroes: paid placements shown in the home hero carousel.
@ApiTags('heroes')
@Controller('heroes')
export class HeroesController {
  constructor(private readonly heroes: HeroesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List heroes. Public: APPROVED + active only. Admin: all statuses, filter by ?status=.' })
  findAll(@Query() query: QueryHeroesDto, @CurrentUser() user: JwtUser | null) {
    return this.heroes.findAll(query, user);
  }

  @Get('quota')
  @ApiOperation({ summary: 'Hero quota and per-day price' })
  quota() {
    return this.heroes.quota();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, OrgContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List the current user's or org's heroes (any status)" })
  findMine(@CurrentUser() user: JwtUser, @OrgContext() ctx: OrgContextDto | null) {
    return this.heroes.findMine(user, ctx);
  }

  @Post()
  @UseGuards(JwtAuthGuard, OrgContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a hero in DRAFT — add to an order to pay and publish' })
  create(@Body() dto: CreateHeroDto, @CurrentUser() user: JwtUser, @OrgContext() ctx: OrgContextDto | null) {
    return this.heroes.create(dto, user, ctx);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a hero (owner or admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHeroDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.heroes.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a hero (owner or admin)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.heroes.remove(id, user);
  }

  // ── Moderación (ADMIN+) ──

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar un hero (ADMIN+)' })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.heroes.approve(id, user, req);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar un hero con motivo (ADMIN+)' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectEventDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.heroes.reject(id, dto.reason, user, req);
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bannear un hero con motivo (ADMIN+)' })
  ban(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectEventDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.heroes.ban(id, dto.reason, user, req);
  }
}
