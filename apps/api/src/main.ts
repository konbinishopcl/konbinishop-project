import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from '../utils/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.disable('x-powered-by');

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

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/uploads' });

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

  const port = config.get<number>('PORT', 3333);

  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}

void bootstrap();
