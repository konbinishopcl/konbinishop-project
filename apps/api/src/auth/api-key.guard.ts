import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly key: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.key = this.config.get<string>('API_KEY');
  }

  private static readonly PUBLIC_PATHS = [
    '/api/payments/transbank/callback',
    '/api/settings/public',
    '/api/stats/public',
  ];

  canActivate(context: ExecutionContext): boolean {
    if (!this.key) return true;

    const req = context.switchToHttp().getRequest<Request>();

    // Allow Transbank callback and other genuinely public endpoints
    if (ApiKeyGuard.PUBLIC_PATHS.some((p) => req.path.startsWith(p))) {
      return true;
    }

    const provided = req.headers['x-api-key'];
    if (!provided || provided !== this.key) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
