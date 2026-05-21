import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mi perfil público (autenticado)' })
  findMine(@CurrentUser() user: JwtUser) {
    return this.profiles.findMine(user);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar mi perfil' })
  update(@Body() dto: UpdateProfileDto, @CurrentUser() user: JwtUser) {
    return this.profiles.update(dto, user);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil por userId (propio o admin)' })
  findByUserId(@Param('userId', ParseIntPipe) userId: number, @CurrentUser() user: JwtUser) {
    return this.profiles.findByUserId(userId, user);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Perfil público por slug — visible solo si tiene eventos aprobados' })
  findPublic(@Param('slug') slug: string) {
    return this.profiles.findPublic(slug);
  }
}
