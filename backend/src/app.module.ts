import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from './User/user.module';
import { GameModuleAdmin } from './modules/SuperAdmin/game/game.module';
import { GameModule } from './modules/game/game.module';
import { SuperAdminPackagesModule } from './modules/SuperAdmin/packages/packages.module';
import { PackagesModule } from './modules/packages/packages.module';
import { categoryModule } from './modules/category/category.module';
import { OrderModule } from './modules/order/order.module';
import { UnifiedSecurityMiddleware, BasicSecurityMiddleware } from './commen/middleware/unified-security.middleware';
import { SecurityModule } from './commen/security/security.module';

@Module({
  imports: [
    // Connect to MongoDB with secure options
    MongooseModule.forRoot(process.env.DB_URL as string, {
      // Enable SSL for secure connection
      // ssl: process.env.NODE_ENV === 'production',
      // Prevent potential NoSQL injection by sanitizing inputs
      sanitizeFilter: true,
    }),
    EventEmitterModule.forRoot(),
    SecurityModule,
    AuthModule,
    UserModule,
    GameModuleAdmin,
    GameModule,
    SuperAdminPackagesModule,
    PackagesModule,
    categoryModule,
    OrderModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply unified security middleware to all routes (includes helmet, sanitization, rate limiting, CSRF)
    consumer.apply(UnifiedSecurityMiddleware).forRoutes('*');
    
    // Apply basic security middleware to health check and status endpoints
    consumer.apply(BasicSecurityMiddleware).forRoutes(
      { path: 'health', method: RequestMethod.GET },
      { path: 'status', method: RequestMethod.GET },
    );
  }
}
