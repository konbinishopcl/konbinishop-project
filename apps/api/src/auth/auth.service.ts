import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import type { User } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { MailService } from '../../services/mailgun/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

  /** Firma un JWT pendiente de 2FA (15 min) — solo válido para POST /auth/2fa/{verify,resend}. */
  private sign2FaPending(user: User): string {
    return this.jwt.sign(
      { sub: user.id, email: user.email, twoFaPending: true },
      { expiresIn: '15m' },
    );
  }

  /** Firma un JWT pendiente de onboarding Google (30 min) — solo válido para POST /auth/google/onboarding. */
  private signOnboardingPending(user: User): string {
    return this.jwt.sign(
      { sub: user.id, email: user.email, onboardingPending: true },
      { expiresIn: '30m' },
    );
  }

  /** Genera un código de 6 dígitos, lo guarda hasheado (SHA-256, 10 min) y lo envía por email. */
  private async issueTwoFaCode(user: User): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: this.hashToken(code),
        twoFactorExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await this.mail.sendTwoFactorCode(user.email, code);
    if (process.env.NODE_ENV === 'development' && !this.config.get('MAILGUN_API_KEY')) {
      this.logger.debug(`2FA code (dev only) for ${user.email}: ${code}`);
    }
  }

  /** Quita campos sensibles antes de devolver el usuario. */
  private sanitize(user: User) {
    const {
      passwordHash: _p,
      resetToken: _t,
      resetTokenExpiry: _e,
      pendingEmail: _pe,
      emailChangeToken: _ect,
      emailChangeTokenExpiry: _ecte,
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
    await this.prisma.profile.create({
      data: {
        userId: user.id,
        slug,
        ...(dto.countryId ? { countryId: dto.countryId } : {}),
      },
    });
    await this.mail.sendWelcome(user.email, user.firstname ?? user.email);
    // 2FA desactivado temporalmente — reactivar antes de producción
    return { token: this.sign(user), user: this.sanitize(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    if (user.blocked) throw new UnauthorizedException('Tu cuenta está bloqueada');
    // 2FA desactivado temporalmente — reactivar antes de producción
    return { token: this.sign(user), user: this.sanitize(user) };
  }

  /** Upsert de usuario Google: busca por googleId → email → crea nuevo. Retorna isNew=true solo si el usuario fue creado en esta llamada. */
  private async upsertGoogleUser(
    googleId: string,
    email: string,
    givenName?: string,
    familyName?: string,
  ): Promise<{ user: User; isNew: boolean }> {
    let user = await this.prisma.user.findUnique({ where: { googleId } });
    if (user) return { user, isNew: false };

    user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { googleId } });
      return { user, isNew: false };
    }

    user = await this.prisma.user.create({
      data: {
        email,
        googleId,
        firstname: givenName ?? null,
        lastname: familyName ?? null,
        role: 'AUTHENTICATED',
        confirmed: true,
      },
    });
    const slug = await this.generateProfileSlug(user.firstname, user.lastname, user.id);
    await this.prisma.profile.create({ data: { userId: user.id, slug } });
    await this.mail.sendWelcome(user.email, user.firstname ?? user.email);
    return { user, isNew: true };
  }

  async googleAuth(accessToken: string) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new UnauthorizedException('Token de Google inválido');
    const payload = await res.json() as {
      sub: string; email: string; email_verified: boolean;
      given_name?: string; family_name?: string;
    };
    if (!payload.email_verified) throw new UnauthorizedException('El email de Google no está verificado');
    if (!payload.email) throw new UnauthorizedException('Google no proporcionó un email');

    const { user, isNew } = await this.upsertGoogleUser(payload.sub, payload.email, payload.given_name, payload.family_name);
    if (user.blocked) throw new UnauthorizedException('Tu cuenta está bloqueada');
    if (isNew) {
      return { onboardingToken: this.signOnboardingPending(user), onboardingRequired: true as const };
    }
    return { token: this.sign(user), user: this.sanitize(user) };
  }

  async googleOneTap(credential: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(clientId);
    let sub: string, email: string, givenName: string | undefined, familyName: string | undefined;
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      const p = ticket.getPayload();
      if (!p || !p.email_verified || !p.email) throw new Error();
      sub = p.sub; email = p.email; givenName = p.given_name; familyName = p.family_name;
    } catch {
      throw new UnauthorizedException('Credencial de Google inválida');
    }

    const { user, isNew } = await this.upsertGoogleUser(sub, email, givenName, familyName);
    if (user.blocked) throw new UnauthorizedException('Tu cuenta está bloqueada');
    if (isNew) {
      return { onboardingToken: this.signOnboardingPending(user), onboardingRequired: true as const };
    }
    return { token: this.sign(user), user: this.sanitize(user) };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  /**
   * Emite un nuevo JWT con el rol actual del usuario en DB.
   * Útil para refrescar el token cuando el rol cambió sin cerrar sesión.
   */
  async refreshToken(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.blocked) throw new UnauthorizedException();
    return { token: this.sign(user), user: this.sanitize(user) };
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
      if (process.env.NODE_ENV === 'development' && !this.config.get('MAILGUN_API_KEY')) {
        this.logger.debug(`Reset URL (dev only): ${resetUrl}`);
      }
    }
    return { ok: true };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash || !(await compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(newPassword, 10) },
    });
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

  /** Valida el código 2FA y emite el JWT definitivo. El payload viene del TwoFaGuard. */
  async verifyTwoFa(userId: number, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.blocked) throw new UnauthorizedException('Tu cuenta está bloqueada');
    if (
      !user.twoFactorCode ||
      !user.twoFactorExpiry ||
      user.twoFactorExpiry < new Date() ||
      user.twoFactorCode !== this.hashToken(code)
    ) {
      throw new UnauthorizedException('Código inválido o expirado');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: null, twoFactorExpiry: null },
    });
    return { token: this.sign(user), user: this.sanitize(user) };
  }

  /** Reenvía un nuevo código 2FA al email del usuario pendiente. */
  async resendTwoFa(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.blocked) throw new UnauthorizedException('Tu cuenta está bloqueada');
    await this.issueTwoFaCode(user);
    return { ok: true };
  }

  /**
   * Completa el onboarding de un usuario Google nuevo: valida país y T&C, emite JWT definitivo.
   * El userId viene del OnboardingGuard (claim onboardingPending del JWT).
   *
   * TODO Phase 13: persistir countryId y acceptedTerms en el modelo User (requiere migración).
   * Por ahora solo se valida la entrada y se emite el JWT — el frontend asume completitud.
   */
  async googleOnboarding(userId: number, countryId: number, acceptedTerms: boolean) {
    if (acceptedTerms !== true) {
      throw new BadRequestException('Debes aceptar los Términos y Condiciones');
    }
    const country = await this.prisma.country.findUnique({ where: { id: countryId } });
    if (!country) throw new BadRequestException('País no válido');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.blocked) throw new UnauthorizedException('Tu cuenta está bloqueada');

    return { token: this.sign(user), user: this.sanitize(user) };
  }

  /**
   * Paso 1 del cambio de email: genera token (24h) y lo envía al NUEVO email.
   * El email actual no recibe nada hasta que se confirme.
   */
  async requestEmailChange(userId: number, newEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.email === newEmail) {
      throw new BadRequestException('El nuevo email es igual al actual');
    }
    const taken = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (taken) {
      throw new ConflictException('Ese email ya está en uso');
    }
    const token = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        pendingEmail: newEmail,
        emailChangeToken: this.hashToken(token),
        emailChangeTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const confirmUrl = `${frontendUrl}/cambiar-email?token=${token}`;
    await this.mail.sendEmailChangeConfirmation(newEmail, confirmUrl);
    if (process.env.NODE_ENV === 'development' && !this.config.get('MAILGUN_API_KEY')) {
      this.logger.debug(`Email change URL (dev only): ${confirmUrl}`);
    }
    return { ok: true };
  }

  /** Paso 2: valida el token, mueve pendingEmail → email y limpia los campos. */
  async confirmEmailChange(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailChangeToken: this.hashToken(token) },
    });
    if (
      !user ||
      !user.emailChangeTokenExpiry ||
      user.emailChangeTokenExpiry < new Date() ||
      !user.pendingEmail
    ) {
      throw new BadRequestException('El enlace de cambio de email es inválido o expiró');
    }
    // Race condition: el pendingEmail puede haberse tomado entre request y confirm.
    const taken = await this.prisma.user.findUnique({ where: { email: user.pendingEmail } });
    if (taken && taken.id !== user.id) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { pendingEmail: null, emailChangeToken: null, emailChangeTokenExpiry: null },
      });
      throw new ConflictException('Ese email ya está en uso');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeTokenExpiry: null,
      },
    });
    return { ok: true };
  }
}
