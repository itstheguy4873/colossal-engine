import { GuiObject } from "./GuiObject";
import { Color3 } from "../datatypes/Color3";
import { UDim2 } from "../datatypes/UDim2";
import { Vector2 } from "../datatypes/Vector2";

/**
 * A clipped rectangle whose contents can be scrolled.
 *
 * CanvasSize is the full scrollable area (usually larger than Size) and
 * CanvasPosition is the top-left point of the visible window into it. The
 * renderer keeps a content element sized to CanvasSize and translates it, so
 * children are positioned relative to the canvas, not the frame.
 */
export class ScrollingFrame extends GuiObject {
	public get ClassName(): string {
		return "ScrollingFrame";
	}

	public CanvasSize: UDim2;
	public CanvasPosition: Vector2;
	public ScrollBarThickness: number;
	public ScrollingEnabled: boolean;
	public ScrollBarImageColor3: Color3;
	public ScrollBarImageTransparency: number;

	constructor(Name: string) {
		super(Name);

		this.CanvasSize = UDim2.fromOffset(0, 0);
		this.CanvasPosition = new Vector2(0, 0);
		this.ScrollBarThickness = 12;
		this.ScrollingEnabled = true;
		this.ScrollBarImageColor3 = Color3.fromRGB(255, 255, 255);
		this.ScrollBarImageTransparency = 0.35;
	}
}
