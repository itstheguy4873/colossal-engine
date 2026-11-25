import { Instance } from "./Instance";

export abstract class SourceContainer extends Instance {
	public get ClassName(): string {
		return "SourceContainer";
	}
	public Source: string;

	constructor(Name: string) {
		super(Name);

		this.Source = "";
	}
}
