import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  CountriesController,
  StatesController,
  CitiesController,
  EventCategoriesController,
  EventTagsController,
  ArticleCategoriesController,
  ArticleTagsController,
} from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [AuthModule],
  controllers: [
    CountriesController,
    StatesController,
    CitiesController,
    EventCategoriesController,
    EventTagsController,
    ArticleCategoriesController,
    ArticleTagsController,
  ],
  providers: [CatalogService],
})
export class CatalogModule {}
