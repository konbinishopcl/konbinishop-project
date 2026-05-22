import { Module } from '@nestjs/common';
import { SpotsController } from './spots.controller';
import { SpotsService } from './spots.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule], // provides JwtAuthGuard + AuditService
  controllers: [SpotsController],
  providers: [SpotsService],
})
export class SpotsModule {}
