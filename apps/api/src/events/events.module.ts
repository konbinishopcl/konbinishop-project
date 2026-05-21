import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // provee JwtAuthGuard / RolesGuard
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
