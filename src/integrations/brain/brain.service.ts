import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { BrainConfigService } from './brain-config.service';
import { TIME } from '../../common/constants';

@Injectable()
export class BrainService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: BrainConfigService,
  ) {}

  private formattedKey(keyString: string): string {
    return `${this.configService.getAppPrefix()}:${keyString}`;
  }

  async memorize<T>(key: string, memorize: T, ttl?: number): Promise<void> {
    const formattedKey = this.formattedKey(key);
    await this.redis.set(formattedKey, JSON.stringify(memorize));
    await this.redis.pexpire(formattedKey, ttl ? ttl : TIME.ONE_MONTH_MS);
  }

  async updateMemory<T>(key: string, newValue: T): Promise<boolean> {
    const formattedKey = this.formattedKey(key);
    const ttl = await this.redis.pttl(formattedKey);

    if (ttl > 0) {
      await this.redis.set(formattedKey, JSON.stringify(newValue), 'PX', ttl);
      return true;
    }
    return false;
  }

  async remindMe<T>(key: string): Promise<T> {
    const formattedKey = this.formattedKey(key);
    const value = await this.redis.get(formattedKey);
    return value ? JSON.parse(value) : null;
  }

  async addToListOfUniqueElements<T>(
    setName: string,
    payload: string,
    ttl: number,
  ): Promise<void> {
    const formattedKey = this.formattedKey(setName);
    await this.redis.sadd(formattedKey, payload);
    await this.redis.pexpire(formattedKey, ttl);
  }

  async isElementInListOfUniqueElements<T>(
    setName: string,
    payload: string,
  ): Promise<boolean> {
    const formattedKey = this.formattedKey(setName);
    return (await this.redis.sismember(formattedKey, payload)) === 1;
  }

  async forget(key: string): Promise<any> {
    const formattedKey = this.formattedKey(key);
    return this.redis.del(formattedKey);
  }

  async forgetMany(keys: string[]): Promise<void> {
    const formattedKeys = keys.map((key) => this.formattedKey(key));
    await Promise.all(
      formattedKeys.map((formattedKey) => this.redis.del(formattedKey)),
    );
  }

  async clearAllKeys(): Promise<void> {
    await this.redis.flushall();
  }

  getCacheKey(id: string, prefix: string): string {
    return `${prefix}:${id}`;
  }
}
