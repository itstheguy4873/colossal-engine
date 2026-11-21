import { DataModel } from "../classes";
import { IBackend } from "../backend/interfaces/IBackend";
import { RenderRegistry } from "../rendering/RenderRegistry";
import { UIRegistry } from "../rendering/UIRegistry";

export class Engine {
	private running = false;
	private animationFrameId: number | null = null;
	private lastFrameTime = 0;

	public readonly Name: string;
	public readonly DataModel: DataModel;

	private readonly Backend: IBackend;

	constructor(Name: string, Backend: IBackend, dataModel?: DataModel) {
		this.Name = Name;
		this.DataModel = dataModel ?? new DataModel(this.Name);
		this.Backend = Backend;
	}

	public async Start(): Promise<void> {
		if (this.running) return;

		await this.Backend.Initialize();

		RenderRegistry.Initialize(this.DataModel.GetService("Workspace"));

		UIRegistry.Initialize(
			this.DataModel.GetService("CoreGui"),
			this.DataModel.GetService("PlayerGui"),
		);

		this.DataModel.GetService("UserInputService").Attach(this.Backend.Input);

		document.title = this.Name;

		const RunService = this.DataModel.GetService("RunService");

		this.running = true;
		this.lastFrameTime = performance.now();

		RunService.Start();

		console.log("Engine started!");

		this.animationFrameId = requestAnimationFrame(this.tick);
	}

	private tick = (Time: number): void => {
		if (!this.running) return;

		const DeltaTime = (Time - this.lastFrameTime) / 1000;
		this.lastFrameTime = Time;

		const RunService = this.DataModel.GetService("RunService");

		RunService.Step(DeltaTime);

		this.Backend.Renderer.Render();
		this.Backend.Gui.Render();

		RunService.PostStep(DeltaTime);

		this.animationFrameId = requestAnimationFrame(this.tick);
	};

	public Stop(): void {
		if (!this.running) return;

		this.running = false;

		this.DataModel.GetService("RunService").Stop();

		RenderRegistry.Reset();
		UIRegistry.Reset();

		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		this.DataModel.GetService("UserInputService").Detach();

		this.Backend.Dispose();

		console.log("Engine stopped!");
	}

	public IsRunning(): boolean {
		return this.running;
	}
}
