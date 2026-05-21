import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { RedisService } from '../redis/redis.service';

const TTL = 86_400; // 1 día en segundos

/**
 * Mapea el prefijo de ruta a una colección de cache.
 * Rutas no mapeadas quedan fuera del cache (orders, payments, auth, users, uploads).
 */
function collectionFromPath(path: string): string | null {
  if (/^\/api\/events/.test(path)) return 'events';
  if (/^\/api\/spots/.test(path)) return 'spots';
  if (/^\/api\/heroes/.test(path)) return 'heroes';
  if (/^\/api\/articles/.test(path)) return 'articles';
  if (/^\/api\/(regions|communes|categories|tags)/.test(path)) return 'catalog';
  return null;
}

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(private readonly redis: RedisService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const res = ctx.switchToHttp().getResponse<Response>();
    const collection = collectionFromPath(req.path);

    // Rutas sin colección asignada (payments, orders, auth…) → sin cache.
    if (!collection) return next.handle();

    const method = req.method.toUpperCase();

    // Mutaciones: ejecutar handler y luego invalidar la colección.
    if (method !== 'GET') {
      return next.handle().pipe(
        tap(() => {
          this.redis
            .deletePattern(`http:${collection}:*`)
            .then(() => this.logger.debug(`Cache invalidado: ${collection}`))
            .catch(() => {});
        }),
      );
    }

    // GET autenticado: no cachear (respuesta varía por rol).
    if (req.headers.authorization) return next.handle();

    // GET público: cache por URL completa con query string.
    const key = `http:${collection}:${req.path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;

    return from(this.redis.get(key)).pipe(
      switchMap((cached) => {
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          return of(JSON.parse(cached));
        }

        res.setHeader('X-Cache', 'MISS');
        return next.handle().pipe(
          tap((data) => {
            this.redis
              .set(key, JSON.stringify(data), TTL)
              .catch(() => {});
          }),
        );
      }),
    );
  }
}
