import { PVInstance } from "./PVInstance";
import { Vector3 } from "../datatypes/Vector3";
import { Color3 } from "../datatypes/Color3";

export abstract class BasePart extends PVInstance {
	public static readonly Abstract = true;

	public get ClassName(): string {
		return "BasePart";
	}
	public Size: Vector3;
	public Color: Color3;

	constructor(Name: string) {
		super(Name);

		this.Size = new Vector3(4, 1, 2);
		this.Color = new Color3(163, 162, 165);
	}
}
