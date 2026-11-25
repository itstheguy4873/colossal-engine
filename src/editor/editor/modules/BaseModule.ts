import { Engine, type Connection } from "../../../engine";

// modules are game scripts that run in the editor
// they provide functionality like the editor camera
// so theyre not coded into the engine itself
export abstract class BaseModule {
	Engine: Engine;

	private RenderConnection: Connection | null = null;

	constructor(engine: Engine) {
		this.Engine = engine;
	}

	BindCallback(): void {
		if (this.RenderConnection) return;

		this.RenderConnection = this.Engine.DataModel.GetService("RunService").RenderStepped.Connect(
			this.Callback,
		);
	}

	UnbindCallback(): void {
		this.RenderConnection?.Disconnect();
		this.RenderConnection = null;
	}

	abstract Callback: (DeltaTime: number) => void;
}
