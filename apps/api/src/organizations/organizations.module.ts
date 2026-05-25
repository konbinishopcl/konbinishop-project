import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { AuthModule } from '../auth/auth.module';
import { MailgunModule } from '../../services/mailgun/mailgun.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, MailgunModule, AuditModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
