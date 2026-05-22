import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [AuthModule],          // provee JwtAuthGuard / RolesGuard
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],        // 07-04..07-06 importan AuditModule y usan AuditService
})
export class AuditModule {}
