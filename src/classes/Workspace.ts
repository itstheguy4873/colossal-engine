import { BaseService } from "./BaseService";
import { Camera } from "./Camera";

export class Workspace extends BaseService {
	public get ClassName(): string {
		return "Workspace";
	}

	public CurrentCamera: Camera = new Camera("Camera");

	constructor(Name: string) {
		super(Name);

		this.CurrentCamera.Parent = this;
	}
}
