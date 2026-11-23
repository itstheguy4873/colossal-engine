import { GuiObject } from "./GuiObject";
import { Signal } from "../datatypes/Signal";

/**
 * Clickable GuiObject, matching Roblox's GuiButton. TextButton and (later)
 * ImageButton extend it; do not create a bare GuiButton.
 *
 * Activated is the input-agnostic event (click, touch, gamepad); the
 * MouseButton1* signals are mouse-specific.
 */
export abstract class GuiButton extends GuiObject {
	public static readonly Abstract = true;

	public get ClassName(): string {
		return "GuiButton";
	}

	public AutoButtonColor: boolean;
	public Modal: boolean;

	public readonly Activated = new Signal<[]>();
	public readonly MouseButton1Click = new Signal<[]>();
	public readonly MouseButton1Down = new Signal<[]>();
	public readonly MouseButton1Up = new Signal<[]>();
	public readonly MouseEnter = new Signal<[]>();
	public readonly MouseLeave = new Signal<[]>();

	constructor(Name: string) {
		super(Name);

		this.AutoButtonColor = true;
		this.Modal = false;
	}
}
