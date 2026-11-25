import { BaseScript } from "./BaseScript";

export class Script extends BaseScript {
	public get ClassName(): string {
		return "Script";
	}

	public static readonly Concrete = true;

	constructor(Name: string) {
		super(Name);
	}
}
