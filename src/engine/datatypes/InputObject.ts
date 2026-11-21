import { Vector3 } from "./Vector3";

/** Mirrors `Enum.UserInputType`, limited to what the web backend reports. */
export type UserInputType =
	"Keyboard" | "MouseButton1" | "MouseButton2" | "MouseButton3" | "MouseButtonOther";

/** Mirrors `Enum.UserInputState` for the edges this engine fires. */
export type UserInputState = "Begin" | "End";

export interface InputObjectProperties {
	UserInputType: UserInputType;
	UserInputState: UserInputState;
	KeyCode?: string | null;
	Position?: Vector3;
	Delta?: Vector3;
}

/**
 * One user input edge, as handed to `UserInputService.InputBegan` and
 * `InputEnded`.
 *
 * `KeyCode` is the DOM `KeyboardEvent.code` (`"KeyW"`, `"Space"`) rather than
 * an `Enum.KeyCode` value, since there is no key-code enum yet. Mouse inputs
 * carry no key code. `Position` is in viewport pixels, so it lines up with
 * `UserInputService.GetMousePosition()`.
 */
export class InputObject {
	public readonly UserInputType: UserInputType;
	public readonly UserInputState: UserInputState;
	public readonly KeyCode: string | null;
	public readonly Position: Vector3;
	public readonly Delta: Vector3;

	constructor(Properties: InputObjectProperties) {
		this.UserInputType = Properties.UserInputType;
		this.UserInputState = Properties.UserInputState;
		this.KeyCode = Properties.KeyCode ?? null;
		this.Position = Properties.Position ?? new Vector3(0, 0, 0);
		this.Delta = Properties.Delta ?? new Vector3(0, 0, 0);
	}
}
