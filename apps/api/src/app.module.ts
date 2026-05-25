import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../utils/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { CatalogModule } from './catalog/catalog.module';
import { UploadsModule } from './uploads/uploads.module';
import { SpotsModule } from './spots/spots.module';
import { HeroesModule } from './heroes/heroes.module';
import { ArticlesModule } from './articles/articles.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { RedisModule } from '../utils/redis/redis.module';
import { HttpCacheInterceptor } from '../utils/cache/http-cache.interceptor';
import { ProfilesModule } from './profiles/profiles.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { LegalModule } from './legal/legal.module';
import { FaqModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { StatsModule } from './stats/stats.module';
import { MailgunModule } from '../services/mailgun/mailgun.module';
import { ApiKeyGuard } from './auth/api-key.guard';
import { AuditModule } from './audit/audit.module';
import { OrgContextModule } from './common/org-context/org-context.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TransfersModule } from './transfers/transfers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    OrgContextModule,
    UsersModule,
    EventsModule,
    CatalogModule,
    UploadsModule,
    SpotsModule,
    HeroesModule,
    ArticlesModule,
    OrdersModule,
    PaymentsModule,
    ProfilesModule,
    NewsletterModule,
    LegalModule,
    FaqModule,
    ContactModule,
    StatsModule,
    MailgunModule,
    AuditModule,
    OrganizationsModule,
    TransfersModule,
    NotificationsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_INTERCEPTOR, useClass: HttpCacheInterceptor },
  ],
})
export class AppModule {}
