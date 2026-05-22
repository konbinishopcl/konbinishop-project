import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('faq')
@Controller('faq')
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  @Get()
  @ApiOperation({ summary: 'Listar preguntas frecuentes (público)' })
  findAll() {
    return this.faq.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una pregunta frecuente por ID (público)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.faq.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una pregunta frecuente (ADMIN+)' })
  create(@Body() dto: CreateFaqDto) {
    return this.faq.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar una pregunta frecuente (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFaqDto) {
    return this.faq.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una pregunta frecuente (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.faq.remove(id);
  }
}
