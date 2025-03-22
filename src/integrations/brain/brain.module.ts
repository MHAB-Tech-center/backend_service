import { DynamicModule, Global, Module } from '@nestjs/common';
import { BrainService } from './brain.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ForRootAsyncOptions, BrainModuleOptions } from './dto/brain.dto';
import { BrainConfigService } from './brain-config.service';

@Module({})
@Global()
export class BrainModule {
  static forRoot(options: BrainModuleOptions): DynamicModule {
    return {
      module: BrainModule,
      imports: [RedisModule.forRoot(options.redisConfig)],
      providers: [
        {
          provide: BrainConfigService,
          useFactory: () => {
            const service = new BrainConfigService();
            service.setAppPrefix(options.appPrefix);
            return service;
          },
        },
        BrainService,
      ],
      exports: [BrainService],
    };
  }

  static forRootAsync(options: ForRootAsyncOptions): DynamicModule {
    return {
      module: BrainModule,
      imports: [
        RedisModule.forRootAsync({
          useFactory: async (...args) => {
            const config = await options.useFactory(...args);
            return config.redisConfig;
          },
          inject: options.inject,
        }),
      ],
      providers: [
        {
          provide: BrainConfigService,
          useFactory: async (...args) => {
            const config = await options.useFactory(...args);
            const service = new BrainConfigService();
            service.setAppPrefix(config.appPrefix);
            return service;
          },
          inject: options.inject,
        },
        BrainService,
      ],
      exports: [BrainService],
    };
  }
}
