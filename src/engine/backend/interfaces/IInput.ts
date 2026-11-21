import type { UserInputState, UserInputType } from "../../datatypes/InputObject";
import type { Vector3 } from "../../datatypes/Vector3";

/**
 * A raw input edge from the platform backend.
 *
 * Backends stay dumb: they report what the user did and whether a GUI or text
 * field consumed it. `UserInputService` turns the event into an `InputObject`
 * and fires the matching signal.
 */
export interface IInputEvent {
	UserInputType: UserInputType;
	UserInputState: UserInputState;
	KeyCode: string | null;
	Position: Vector3;
	Delta: Vector3;
	/** True when a GUI element or text field consumed the input. */
	GameProcessedEvent: boolean;
}

export interface IInput {
	Initialize(): void;

	IsKeyDown(key: string): boolean;
	IsMouseButtonDown(button: number): boolean;

	GetMousePosition(): { X: number; Y: number };

	/** Listen for input edges. Returns a function that unsubscribes. */
	Subscribe(Listener: (Event: IInputEvent) => void): () => void;

	Dispose(): void;
}
