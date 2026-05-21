import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AuthModule } from '../auth/auth.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [AuthModule, LikesModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
