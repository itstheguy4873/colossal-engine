import { SourceContainer } from "./SourceContainer";

export class ModuleScript extends SourceContainer {
	public get ClassName(): string {
		return "ModuleScript";
	}

	public static readonly Concrete = true;

	constructor(Name: string) {
		super(Name);
	}
}
