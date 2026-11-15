import { BaseService } from './BaseService';
import { Signal } from '../datatypes/Signal';

export class RunService extends BaseService {
  public get ClassName(): string {
    return 'RunService';
  }

  public readonly Heartbeat = new Signal<[DeltaTime: number]>();
  public readonly RenderStepped = new Signal<[DeltaTime: number]>();
  public readonly Stepped = new Signal<[Time: number, DeltaTime: number]>();

  private Running = false;

  constructor(Name: string) {
    super(Name);
  }

  public IsRunning(): boolean {
    return this.Running;
  }

  public Start(): void {
    this.Running = true;
  }

  public Stop(): void {
    this.Running = false;
  }

  public Step(DeltaTime: number): void {
    if (!this.Running) return;

    const Time = performance.now() / 1000;

    this.Stepped.Fire(Time, DeltaTime);
    this.RenderStepped.Fire(DeltaTime);
  }

  public PostStep(DeltaTime: number): void {
    if (!this.Running) return;

    this.Heartbeat.Fire(DeltaTime);
  }
}
