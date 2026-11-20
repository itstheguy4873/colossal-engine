import { CFrame, Color3, DataModel, InstanceFactory, Vector3 } from "../../engine";

/**
 * An open place: the `DataModel` the editor's widgets share, plus the default
 * contents of the scene.
 *
 * The project owns the data, not the renderer. Panels receive `DataModel` and
 * read from it; only `scene-widget` attaches a backend and starts an `Engine`
 * over it, so stopping the engine no longer throws the scene away.
 */
export class EditorProject {
	public readonly DataModel: DataModel;

	constructor(Name: string = "Colossal Engine") {
		this.DataModel = new DataModel(Name);
		this.BuildScene();
	}

	private BuildScene(): void {
		const Workspace = this.DataModel.GetService("Workspace");

		const Baseplate = InstanceFactory.new("Part");
		Baseplate.Name = "Baseplate";
		Baseplate.Size = new Vector3(30, 1, 30);
		Baseplate.Color = Color3.fromRGB(52, 52, 62);
		Baseplate.Parent = Workspace;

		const Part = InstanceFactory.new("Part");
		Part.Name = "Part";
		Part.Size = new Vector3(4, 4, 4);
		Part.CFrame = new CFrame(new Vector3(0, 2.5, 0), new Vector3(0, 0.4, 0));
		Part.Color = Color3.fromRGB(200, 65, 65);
		Part.Parent = Workspace;

		Workspace.CurrentCamera.CFrame = new CFrame(new Vector3(0, 9, 16), new Vector3(-0.5, 0, 0));
	}
}
