import { GuiObject } from "./GuiObject";
import { Color3 } from "../datatypes/Color3";
import { Signal } from "../datatypes/Signal";
import { TextXAlignment } from "./TextAlignment";

/**
 * Editable text field. The renderer mounts a real <input> (or <textarea> when
 * MultiLine is set) inside the GUI element, so IME, selection and the caret
 * come from the browser.
 *
 * TextChanged fires per edit, Focused when the field gains focus, and
 * FocusLost when it loses focus (EnterPressed is true when Enter caused it).
 * Roblox also passes an InputObject to FocusLost; there is no such type here.
 */
export class TextBox extends GuiObject {
	public get ClassName(): string {
		return "TextBox";
	}

	public Text: string;
	public PlaceholderText: string;
	public PlaceholderColor3: Color3;
	public TextSize: number;
	public TextColor3: Color3;
	public TextXAlignment: TextXAlignment;
	public ClearTextOnFocus: boolean;
	public MultiLine: boolean;
	public TextEditable: boolean;

	public readonly TextChanged = new Signal<[Text: string]>();
	public readonly Focused = new Signal<[]>();
	public readonly FocusLost = new Signal<[EnterPressed: boolean]>();

	constructor(Name: string) {
		super(Name);

		this.Text = "";
		this.PlaceholderText = "";
		this.PlaceholderColor3 = Color3.fromRGB(178, 178, 178);
		this.TextSize = 14;
		this.TextColor3 = Color3.fromRGB(0, 0, 0);
		this.TextXAlignment = "Left";
		this.ClearTextOnFocus = true;
		this.MultiLine = false;
		this.TextEditable = true;
	}
}
