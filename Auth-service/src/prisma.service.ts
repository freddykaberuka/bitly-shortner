import {
  Global,
  INestApplication,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '.prisma/client';

@Injectable()
@Global()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: { url: configService.get('databaseUrl') },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  /**
   * Apply middleware to prisma for delete, find,...
   */
  applyPrismaMiddleware() {
    this.$use(async (params, next) => {
      // SET deletedAt when deleting
      if (params.action == 'delete') {
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }
      if (params.action == 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data != undefined) {
          params.args.data['deletedAt'] = new Date();
        } else {
          params.args['data'] = { deletedAt: new Date() };
        }
      }

      // Ignore records with deletedAt when updating
      if (params.action == 'update') {
        params.action = 'updateMany';
        params.args.where['deletedAt'] = null;
      }
      if (params.action == 'updateMany') {
        if (params.args.where != undefined) {
          params.args.where['deletedAt'] = null;
        } else {
          params.args['where'] = { deletedAt: null };
        }
      }

      // Ignore records with deletedAt when finding
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.action = 'findFirst';
        params.args.where['deletedAt'] = null;
      }
      if (params.action === 'findMany' || params.action === 'count') {
        if (params.args.where) {
          if (params.args.where.deletedAt == undefined) {
            params.args.where['deletedAt'] = null;
          }
        } else {
          params.args['where'] = { deletedAt: null };
        }
      }
      return next(params);
    });
  }
}
