import { BaseScript } from "./BaseScript";

export class LocalScript extends BaseScript {
	public get ClassName(): string {
		return "LocalScript";
	}

	public static readonly Concrete = true;

	constructor(Name: string) {
		super(Name);
	}
}
