import { Injectable } from '@nestjs/common';

@Injectable()
export class BrainConfigService {
  private appPrefix: string;

  setAppPrefix(prefix: string) {
    this.appPrefix = prefix;
  }

  getAppPrefix(): string {
    return this.appPrefix;
  }
}
