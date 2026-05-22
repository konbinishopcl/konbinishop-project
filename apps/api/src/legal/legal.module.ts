import { Module } from '@nestjs/common';
import { TermsController } from './terms.controller';
import { PrivacyController } from './privacy.controller';
import { LegalService } from './legal.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TermsController, PrivacyController],
  providers: [LegalService],
})
export class LegalModule {}
