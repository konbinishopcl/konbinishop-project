import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CountriesController, StatesController, CitiesController, CategoriesController, TagsController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [AuthModule],
  controllers: [CountriesController, StatesController, CitiesController, CategoriesController, TagsController],
  providers: [CatalogService],
})
export class CatalogModule {}
