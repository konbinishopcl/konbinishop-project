import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { CrmService } from './crm.service';
import { QueryCrmDto } from './dto/query-crm.dto';
import { UpdateCrmStageDto } from './dto/update-crm-stage.dto';
import { CreateCrmNoteDto } from './dto/create-crm-note.dto';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('crm')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get()
  @ApiOperation({ summary: 'Listar entradas CRM con filtros opcionales (ADMIN+)' })
  list(@Query() query: QueryCrmDto) {
    return this.crm.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una entrada CRM con notas y source (ADMIN+)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.crm.findOne(id);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Actualizar stage del CRM (LOST requiere stageReason) (ADMIN+)' })
  updateStage(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCrmStageDto) {
    return this.crm.updateStage(id, dto);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Añadir nota interna a una entrada CRM (ADMIN+)' })
  addNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCrmNoteDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.crm.addNote(id, dto, user.sub);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Listar notas de una entrada CRM (ADMIN+)' })
  listNotes(@Param('id', ParseIntPipe) id: number) {
    return this.crm.listNotes(id);
  }
}
