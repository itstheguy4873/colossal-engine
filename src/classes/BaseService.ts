import { Instance } from './Instance';

export abstract class BaseService extends Instance {
  public get ClassName(): string {
    return 'BaseService';
  }

  constructor(Name: string) {
    super(Name);
  }
}
