import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly key: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.key = this.config.get<string>('API_KEY');
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.key) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-api-key'];

    if (!provided || provided !== this.key) {
      throw new UnauthorizedException('API key inválida o ausente');
    }
    return true;
  }
}
