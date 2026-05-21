import { Module } from '@nestjs/common';
import { TransbankService } from './transbank.service';

@Module({
  providers: [TransbankService],
  exports: [TransbankService],
})
export class TransbankModule {}
