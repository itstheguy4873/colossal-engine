import { DataModel } from '../classes';
import { IBackend } from '../backend/interfaces/IBackend';
import { RunService } from '../classes';
import { UserInputService } from '../classes';
import { Workspace } from '../classes';
import { RenderRegistry } from '../rendering/RenderRegistry';

export class Engine {
  private running = false;
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;

  public readonly Name: string;
  public readonly DataModel: DataModel;

  private readonly Backend: IBackend;

  constructor(Name: string, Backend: IBackend) {
    this.Name = Name;
    this.DataModel = new DataModel(this.Name);
    this.Backend = Backend;
  }

  public async Start(): Promise<void> {
    if (this.running) return;

    await this.Backend.Initialize();

    RenderRegistry.Initialize(this.DataModel.GetService<Workspace>('Workspace'));

    this.DataModel.GetService<UserInputService>('UserInputService').Attach(this.Backend.Input);

    document.title = this.Name;

    const RunService = this.DataModel.GetService<RunService>('RunService');

    this.running = true;
    this.lastFrameTime = performance.now();

    RunService.Start();

    console.log('Engine started!');

    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  private tick = (Time: number): void => {
    if (!this.running) return;

    const DeltaTime = (Time - this.lastFrameTime) / 1000;
    this.lastFrameTime = Time;

    const RunService = this.DataModel.GetService<RunService>('RunService');

    RunService.Step(DeltaTime);

    this.Backend.Renderer.Render();

    RunService.PostStep(DeltaTime);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  public Stop(): void {
    if (!this.running) return;

    this.running = false;

    this.DataModel.GetService<RunService>('RunService').Stop();

    RenderRegistry.Reset();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.DataModel.GetService<UserInputService>('UserInputService').Detach();

    this.Backend.Dispose();

    console.log('Engine stopped!');
  }

  public IsRunning(): boolean {
    return this.running;
  }
}
