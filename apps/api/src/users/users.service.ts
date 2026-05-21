import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Campos públicos del usuario (nunca exponemos passwordHash).
const USER_SELECT = {
  id: true,
  email: true,
  firstname: true,
  lastname: true,
  rut: true,
  isCompany: true,
  role: true,
  confirmed: true,
  blocked: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT, orderBy: { id: 'asc' } });
  }

  findRecent() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        firstname: true,
        lastname: true,
        profile: { select: { avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await hash(dto.password, 10),
        firstname: dto.firstname,
        lastname: dto.lastname,
        role: dto.role ?? 'AUTHENTICATED',
        confirmed: true,
      },
      select: USER_SELECT,
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.ensure(id);
    return this.prisma.user.update({ where: { id }, data: { ...dto }, select: USER_SELECT });
  }

  async setBanned(id: number, blocked: boolean) {
    await this.ensure(id);
    return this.prisma.user.update({ where: { id }, data: { blocked }, select: USER_SELECT });
  }

  async remove(id: number) {
    await this.ensure(id);
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensure(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
  }
}
