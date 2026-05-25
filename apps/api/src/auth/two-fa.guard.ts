import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type TwoFaUser = { sub: number; email: string; twoFaPending: true; iat: number; exp: number };

/** Guard para endpoints de 2FA — solo acepta tokens con twoFaPending === true. */
@Injectable()
export class TwoFaGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    let payload: TwoFaUser;
    try {
      payload = this.jwt.verify(header.slice(7)) as TwoFaUser;
    } catch {
      throw new UnauthorizedException();
    }
    if (!payload.twoFaPending) {
      throw new UnauthorizedException('Token no es de 2FA pendiente');
    }
    (req as Request & { user: unknown }).user = payload;
    return true;
  }
}
