import { LayerCollector } from "./LayerCollector";

export class ScreenGui extends LayerCollector {
	public get ClassName(): string {
		return "ScreenGui";
	}

	constructor(Name: string) {
		super(Name);
	}
}
