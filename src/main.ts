import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';
import { configure } from './_shared/config/config';
import { BadRequestExceptionFilter } from './_shared/filters/ExceptionsFilters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  prismaService.applyPrismaMiddleware();
  app.useGlobalFilters(new BadRequestExceptionFilter());
  configure(app);
  const port = app.get(ConfigService).get('port');
  await app.listen(port || 3000);
}
bootstrap();