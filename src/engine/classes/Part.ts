import { BasePart } from "./BasePart";
import { PartType } from "../enums/PartType";

export class Part extends BasePart {
	public static readonly Concrete = true;

	public get ClassName(): string {
		return "Part";
	}
	public PartType: PartType;

	constructor(Name: string) {
		super(Name);

		this.PartType = PartType.Block;
	}
}
