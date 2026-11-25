import { PVInstance } from "./PVInstance";
import { CFrame } from "../datatypes/CFrame";
import { Vector3 } from "../datatypes/Vector3";

export class Camera extends PVInstance {
	public static readonly Concrete = true;

	public get ClassName(): string {
		return "Camera";
	}

	public CFrame: CFrame;
	public FieldOfView: number;

	constructor(Name: string) {
		super(Name);

		this.CFrame = new CFrame(new Vector3(0, 0, 5), new Vector3(0, 0, 0));
		this.FieldOfView = 75;
	}
}
