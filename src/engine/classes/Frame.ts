import { GuiObject } from "./GuiObject";

/** A plain rectangle: the container for labels, buttons, and layouts. */
export class Frame extends GuiObject {
	public static readonly Concrete = true;

	public get ClassName(): string {
		return "Frame";
	}
}
