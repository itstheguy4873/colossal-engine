import { GuiObject } from "./GuiObject";

/** A plain rectangle: the container for labels, buttons, and layouts. */
export class Frame extends GuiObject {
	public get ClassName(): string {
		return "Frame";
	}
}
