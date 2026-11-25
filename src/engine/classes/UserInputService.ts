import { BaseService } from "./BaseService";
import type { IInput, IInputEvent } from "../backend/interfaces/IInput";
import { InputObject } from "../datatypes/InputObject";
import { Signal } from "../datatypes/Signal";

/**
 * Input state and edges for the running game.
 *
 * `InputBegan` / `InputEnded` mirror Roblox: the signal passes the edge as an
 * `InputObject` plus `GameProcessedEvent`, which is true when a GUI element or
 * text field consumed the input. The polled helpers (`IsKeyDown`, ...) keep
 * working alongside the signals.
 */
export class UserInputService extends BaseService {
	public static readonly Concrete = true;

	public get ClassName(): string {
		return "UserInputService";
	}

	public readonly InputBegan = new Signal<[Input: InputObject, GameProcessedEvent: boolean]>();

	public readonly InputEnded = new Signal<[Input: InputObject, GameProcessedEvent: boolean]>();

	private Input: IInput | null = null;
	private Unsubscribe: (() => void) | null = null;

	public Attach(Input: IInput): void {
		if (this.Input === Input) return;

		this.Detach();

		this.Input = Input;
		this.Unsubscribe = Input.Subscribe((Event) => this.Dispatch(Event));
	}

	public Detach(): void {
		this.Unsubscribe?.();
		this.Unsubscribe = null;
		this.Input = null;
	}

	public IsKeyDown(Key: string): boolean {
		return this.Input?.IsKeyDown(Key) ?? false;
	}

	public IsMouseButtonDown(Button: number): boolean {
		return this.Input?.IsMouseButtonDown(Button) ?? false;
	}

	public GetMousePosition(): { X: number; Y: number } {
		return this.Input?.GetMousePosition() ?? { X: 0, Y: 0 };
	}

	private Dispatch(Event: IInputEvent): void {
		const Input = new InputObject({
			UserInputType: Event.UserInputType,
			UserInputState: Event.UserInputState,
			KeyCode: Event.KeyCode,
			Position: Event.Position,
			Delta: Event.Delta,
		});

		if (Event.UserInputState === "Begin") {
			this.InputBegan.Fire(Input, Event.GameProcessedEvent);
			return;
		}

		this.InputEnded.Fire(Input, Event.GameProcessedEvent);
	}
}
