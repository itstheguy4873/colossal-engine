import { PVInstance } from "./PVInstance";
import { Vector3 } from "../datatypes/Vector3";

export abstract class BasePart extends PVInstance {
	public get ClassName(): string {
		return "BasePart";
	}
	public Size: Vector3;

	constructor(Name: string) {
		super(Name);

		this.Size = new Vector3(4, 1, 2);
	}
}
