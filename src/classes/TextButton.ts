import { GuiButton } from "./GuiButton";
import { Color3 } from "../datatypes/Color3";
import { TextXAlignment, TextYAlignment } from "./TextAlignment";

/**
 * A clickable rectangle with centred text. Interaction (hover tint, Activated)
 * is provided by GuiButton; the text properties mirror TextLabel.
 */
export class TextButton extends GuiButton {
	public get ClassName(): string {
		return "TextButton";
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
