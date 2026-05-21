import { Global, Module } from '@nestjs/common';
import { MailgunModule } from '../../services/mailgun/mailgun.module';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [MailgunModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
