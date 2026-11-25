import { GuiBase } from "./GuiBase";

/**
 * A root of the 2D UI tree, like Roblox's LayerCollector. ScreenGui extends it;
 * each LayerCollector is mounted as one layer by the GUI renderer.
 */
export abstract class LayerCollector extends GuiBase {
	public get ClassName(): string {
		return "LayerCollector";
	}

	public Enabled: boolean;
	public ResetOnSpawn: boolean;
	public DisplayOrder: number;
	public IgnoreGuiInset: boolean;

	constructor(Name: string) {
		super(Name);

		this.Enabled = true;
		this.ResetOnSpawn = true;
		this.DisplayOrder = 0;
		this.IgnoreGuiInset = false;
	}
}
