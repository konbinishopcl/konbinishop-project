import { Module } from '@nestjs/common';
import { HeroesController } from './heroes.controller';
import { HeroesService } from './heroes.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule], // provides JwtAuthGuard + AuditService
  controllers: [HeroesController],
  providers: [HeroesService],
})
export class HeroesModule {}
