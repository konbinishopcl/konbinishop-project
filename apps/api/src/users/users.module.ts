import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AuthModule, AuditModule, EventsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
