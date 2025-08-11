import { config } from 'dotenv';
config()
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from "express"
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors()
  app.use("/order/webhook" , express.raw({type: "application/json"}))
  await app.listen(process.env.PORT ?? 3000);
  // await app.listen(3001);
}
bootstrap();
