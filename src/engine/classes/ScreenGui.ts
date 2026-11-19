import { LayerCollector } from "./LayerCollector";

/** A layer of 2D UI that fills the viewport. */
export class ScreenGui extends LayerCollector {
	public get ClassName(): string {
		return "ScreenGui";
	}
}
