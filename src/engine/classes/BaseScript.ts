import { SourceContainer } from "./SourceContainer";

export abstract class BaseScript extends SourceContainer {
	public get ClassName(): string {
		return "BaseScript";
	}
	public Enabled: boolean;

	constructor(Name: string) {
		super(Name);

		this.Enabled = true;
	}
}
