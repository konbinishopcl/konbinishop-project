import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { HeroesService } from './heroes.service';
import { CreateHeroDto } from './dto/create-hero.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { RejectEventDto } from '../events/dto/reject-event.dto';

// Heroes: paid placements shown in the home hero carousel.
@ApiTags('heroes')
@Controller('heroes')
export class HeroesController {
  constructor(private readonly heroes: HeroesService) {}

  @Get()
  @ApiOperation({ summary: 'List active heroes (public)' })
  findActive() {
    return this.heroes.findActive();
  }

  @Get('quota')
  @ApiOperation({ summary: 'Hero quota and per-day price' })
  quota() {
    return this.heroes.quota();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List the current user's heroes (any status)" })
  findMine(@CurrentUser() user: JwtUser) {
    return this.heroes.findMine(user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a hero in DRAFT — add to an order to pay and publish' })
  create(@Body() dto: CreateHeroDto, @CurrentUser() user: JwtUser) {
    return this.heroes.create(dto, user);
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
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.heroes.approve(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar un hero con motivo (ADMIN+)' })
  reject(@Param('id', ParseIntPipe) id: number, @Body() dto: RejectEventDto) {
    return this.heroes.reject(id, dto.reason);
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bannear un hero con motivo (ADMIN+)' })
  ban(@Param('id', ParseIntPipe) id: number, @Body() dto: RejectEventDto) {
    return this.heroes.ban(id, dto.reason);
  }
}
