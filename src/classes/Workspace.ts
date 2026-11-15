import { BaseService } from './BaseService';

export class Workspace extends BaseService {
  public get ClassName(): string {
    return 'Workspace';
  }

  constructor(Name: string) {
    super(Name);
  }
}
