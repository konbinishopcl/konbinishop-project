import { Global, Module } from '@nestjs/common';
import { MailgunService } from './mailgun.service';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [MailgunService, MailService],
  exports: [MailService],
})
export class MailgunModule {}
