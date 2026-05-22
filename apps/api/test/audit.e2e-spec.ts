/**
 * Tests e2e del endpoint GET /api/admin/audit-logs.
 *
 * NOTA: Estos tests requieren una conexión activa a la base de datos MySQL.
 * La DB del proyecto reside en el VPS (no disponible en el entorno de desarrollo local).
 * Por eso la suite está marcada como `describe.skip` — el archivo compila y está listo
 * para ejecutarse en un entorno con DB (CI/CD, staging, VPS).
 *
 * Para ejecutar manualmente en un entorno con DB:
 *   DATABASE_URL="mysql://..." npx jest test/audit.e2e-spec --no-coverage
 *
 * Si API_KEY está configurada en el entorno, todos los requests deben incluir el header
 * x-api-key con ese valor (ver apps/api/src/auth/api-key.guard.ts).
 * Si API_KEY no está configurada, el guard pasa sin verificar (early return).
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe.skip('AuditController (e2e) — requiere DB en VPS', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Header de API key para el guard global (si API_KEY no está definida, el guard pasa sin él)
  const apiKey = process.env.API_KEY;
  const apiKeyHeaders = apiKey ? { 'x-api-key': apiKey } : {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  /** Genera un JWT con el mismo payload que AuthService.sign() */
  function makeToken(userId: number, role: string): string {
    return jwtService.sign({ sub: userId, email: `user${userId}@test.com`, role });
  }

  describe('GET /api/admin/audit-logs', () => {
    it('responde 401 sin token', () => {
      return request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set(apiKeyHeaders)
        .expect(401);
    });

    it('responde 403 con token de rol AUTHENTICATED', () => {
      const token = makeToken(99, 'AUTHENTICATED');
      return request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set({ ...apiKeyHeaders, Authorization: `Bearer ${token}` })
        .expect(403);
    });

    it('responde 200 con token de rol ADMIN y body con forma { items, total, page, pageSize, totalPages }', async () => {
      const token = makeToken(1, 'ADMIN');
      const res = await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set({ ...apiKeyHeaders, Authorization: `Bearer ${token}` })
        .expect(200);

      expect(res.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('responde 200 con token de rol SUPER_ADMIN', () => {
      const token = makeToken(1, 'SUPER_ADMIN');
      return request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set({ ...apiKeyHeaders, Authorization: `Bearer ${token}` })
        .expect(200);
    });
  });
});
