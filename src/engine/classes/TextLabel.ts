import { GuiObject } from "./GuiObject";
import { Color3 } from "../datatypes/Color3";
import { TextXAlignment, TextYAlignment } from "./TextAlignment";

export class TextLabel extends GuiObject {
	public get ClassName(): string {
		return "TextLabel";
	}

	public Text: string;
	public TextSize: number;
	public TextColor3: Color3;
	public TextWrapped: boolean;
	public TextXAlignment: TextXAlignment;
	public TextYAlignment: TextYAlignment;

	constructor(Name: string) {
		super(Name);

		this.Text = "";
		this.TextSize = 14;
		this.TextColor3 = Color3.fromRGB(0, 0, 0);
		this.TextWrapped = false;
		this.TextXAlignment = "Center";
		this.TextYAlignment = "Center";
	}
}
