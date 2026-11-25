import { GuiBase } from "./GuiBase";
import { UDim2 } from "../datatypes/UDim2";
import { Vector2 } from "../datatypes/Vector2";
import { Color3 } from "../datatypes/Color3";

/**
 * Anything positioned inside a ScreenGui: Frame, TextLabel, and later buttons
 * and layout containers.
 *
 * Position and Size are relative to the parent GuiObject (or the ScreenGui),
 * AnchorPoint shifts the box relative to its own size, and BackgroundColor3
 * plus BackgroundTransparency produce the CSS colour.
 */
export abstract class GuiObject extends GuiBase {
	public get ClassName(): string {
		return "GuiObject";
	}

	public Position: UDim2;
	public Size: UDim2;
	public AnchorPoint: Vector2;
	public BackgroundColor3: Color3;
	public BackgroundTransparency: number;
	public BorderSizePixel: number;
	public ClipsDescendants: boolean;
	public LayoutOrder: number;
	public Rotation: number;
	public Visible: boolean;
	public ZIndex: number;

	constructor(Name: string) {
		super(Name);

		this.Position = UDim2.fromOffset(0, 0);
		this.Size = UDim2.fromOffset(0, 0);
		this.AnchorPoint = new Vector2(0, 0);
		this.BackgroundColor3 = Color3.fromRGB(255, 255, 255);
		this.BackgroundTransparency = 0;
		this.BorderSizePixel = 0;
		this.ClipsDescendants = false;
		this.LayoutOrder = 0;
		this.Rotation = 0;
		this.Visible = true;
		this.ZIndex = 1;
	}
}
