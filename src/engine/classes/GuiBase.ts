import { Instance } from "./Instance";

/**
 * Base class for everything the GUI renderer can draw, mirroring Roblox's
 * GuiBase2d. It carries no layout state itself: GuiObjects own Position/Size,
 * LayerCollectors own the screen-level switches.
 */
export abstract class GuiBase extends Instance {
	public get ClassName(): string {
		return "GuiBase";
	}
}
