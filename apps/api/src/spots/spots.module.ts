import { Module } from '@nestjs/common';
import { SpotsController } from './spots.controller';
import { SpotsService } from './spots.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // provides JwtAuthGuard
  controllers: [SpotsController],
  providers: [SpotsService],
})
export class SpotsModule {}
