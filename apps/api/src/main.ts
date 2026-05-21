import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3333);

  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}

void bootstrap();
