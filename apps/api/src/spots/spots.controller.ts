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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SpotsService } from './spots.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';

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

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List the current user's spots" })
  findMine(@CurrentUser() user: JwtUser) {
    return this.spots.findMine(user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a spot (any authenticated user, subject to max days)',
  })
  @ApiBadRequestResponse({ description: 'expirationDate exceeds SPOT_MAX_DAYS' })
  create(@Body() dto: CreateSpotDto, @CurrentUser() user: JwtUser) {
    return this.spots.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a spot (owner or admin)' })
  @ApiBadRequestResponse({ description: 'expirationDate exceeds SPOT_MAX_DAYS' })
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
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.spots.remove(id, user);
  }
}
