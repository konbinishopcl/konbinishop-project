import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type OnboardingUser = { sub: number; email: string; onboardingPending: true };

type OnboardingPayload = OnboardingUser & { iat: number; exp: number };

/** Guard para el endpoint de onboarding Google — solo acepta tokens con onboardingPending === true. */
@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    let payload: OnboardingPayload;
    try {
      payload = this.jwt.verify(header.slice(7)) as OnboardingPayload;
    } catch {
      throw new UnauthorizedException();
    }
    if (!payload.onboardingPending) {
      throw new UnauthorizedException('Token no es de onboarding pendiente');
    }
    (req as Request & { user: unknown }).user = payload;
    return true;
  }
}
