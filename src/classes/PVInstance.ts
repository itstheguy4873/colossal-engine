import { Instance } from './Instance';
import { CFrame } from '../datatypes/CFrame';
import { Vector3 } from '../datatypes/Vector3';

export abstract class PVInstance extends Instance {
  public get ClassName(): string {
    return 'PVInstance';
  }
  public CFrame: CFrame;

  constructor(Name: string, Parent: Instance | null = null) {
    super(Name, Parent);

    this.CFrame = new CFrame(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
  }
}
