import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  /** Firma un JWT con id, email y rol del usuario. */
  private sign(user: User): string {
    return this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
  }

  /** Quita campos sensibles antes de devolver el usuario. */
  private sanitize(user: User) {
    const {
      passwordHash: _p,
      resetToken: _t,
      resetTokenExpiry: _e,
      ...safe
    } = user;
    return safe;
  }

  /** Hash SHA-256 del token de recuperación (lo que se guarda y se compara). */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Genera un slug único para el perfil público del usuario. */
  private async generateProfileSlug(firstname: string | null, lastname: string | null, userId: number): Promise<string> {
    const base = [firstname, lastname]
      .filter(Boolean)
      .join(' ')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `user-${userId}`;
    let candidate = base;
    let attempt = 0;
    while (true) {
      const existing = await this.prisma.profile.findUnique({ where: { slug: candidate } });
      if (!existing) return candidate;
      attempt++;
      candidate = `${base}-${attempt}`;
    }
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await hash(dto.password, 10),
        firstname: dto.firstname,
        lastname: dto.lastname,
        role: 'AUTHENTICATED',
        confirmed: true,
      },
    });
    const slug = await this.generateProfileSlug(user.firstname, user.lastname, user.id);
    await this.prisma.profile.create({ data: { userId: user.id, slug } });
    await this.mail.sendWelcome(user.email, user.firstname ?? user.email);
    return { token: this.sign(user), user: this.sanitize(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    if (user.blocked) throw new UnauthorizedException('Tu cuenta está bloqueada');
    return { token: this.sign(user), user: this.sanitize(user) };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  /**
   * Paso 1 de recuperación: genera un token (válido 1 h) y lo asocia al usuario.
   * Sin infraestructura de email, el token se registra en el log del servidor;
   * en v2 se enviará por correo. La respuesta es uniforme y no revela si el
   * email existe.
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.blocked) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: this.hashToken(token),
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const resetUrl = `${frontendUrl}/recuperar-contrasena?token=${token}`;
      await this.mail.sendPasswordReset(user.email, resetUrl);
      // Fallback dev: mostrar el token en el log cuando Mailgun no está configurado
      if (!this.config.get('MAILGUN_API_KEY')) {
        console.log(`🔑 Token de recuperación para ${email}: ${token}`);
      }
    }
    return { ok: true };
  }

  /** Paso 2 de recuperación: valida el token y fija la nueva contraseña. */
  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: this.hashToken(token) },
    });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('El enlace de recuperación es inválido o expiró');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(password, 10),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    return { ok: true };
  }
}
