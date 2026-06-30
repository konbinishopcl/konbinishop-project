import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from '../utils/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Crea e inicializa la app Nest (sin escuchar un puerto). Compartido entre el
 * arranque local (bootstrap) y el handler serverless de Vercel (api/index.ts).
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.disable('x-powered-by');

  // Detrás de Nginx: confiar en 1 hop para que req.ip refleje la IP real del cliente
  // (vía X-Forwarded-For) en lugar de la IP interna del proxy. Lo usa el AuditService.
  app.set('trust proxy', 1);

  // Headers de seguridad HTTP.
  app.use(helmet());

  const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (origin === frontendUrl) return cb(null, true);
      // Vercel preview deploys usan URLs con hashes que cambian en cada deploy
      if (origin.includes('konbini-project-website') && origin.endsWith('.vercel.app')) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Imágenes legacy servidas desde disco: solo local. En Vercel (serverless, sin
  // disco persistente) las imágenes viven en Vercel Blob — ver UploadsService.
  if (!process.env.VERCEL) {
    app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/uploads' });
  }

  // Swagger solo en desarrollo local.
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Konbini API')
      .setDescription('API de publicación de eventos de Konbini (NestJS + Prisma).')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  await app.init();
  return app;
}

/** Arranque local con servidor HTTP (PM2 / dev). En Vercel se usa api/index.ts. */
async function bootstrap() {
  const app = await createApp();
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3333);
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}

// Solo levanta el servidor cuando se ejecuta directamente (node dist/src/main),
// no cuando el handler serverless importa createApp().
if (require.main === module) {
  void bootstrap();
}
