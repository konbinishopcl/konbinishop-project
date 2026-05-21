import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RegionsController, CommunesController, CategoriesController, TagsController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [AuthModule],
  controllers: [RegionsController, CommunesController, CategoriesController, TagsController],
  providers: [CatalogService],
})
export class CatalogModule {}
