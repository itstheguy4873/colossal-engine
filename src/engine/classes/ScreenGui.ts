import { LayerCollector } from "./LayerCollector";

/** A layer of 2D UI that fills the viewport. */
export class ScreenGui extends LayerCollector {
	public static readonly Concrete = true;

	public get ClassName(): string {
		return "ScreenGui";
	}
}
