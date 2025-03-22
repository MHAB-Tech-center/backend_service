import { DynamicModule } from '@nestjs/common';
import { RedisModuleOptions } from '@nestjs-modules/ioredis';

export interface BrainModuleOptions {
  redisConfig: RedisModuleOptions;
  appPrefix: string;
}

export interface ForRootAsyncOptions {
  useFactory: (...args: any[]) => Promise<BrainModuleOptions>;
  inject: any[];
}
