import type { IInput, IInputEvent } from "../../interfaces/IInput";
import type { UserInputType } from "../../../datatypes/InputObject";
import { Vector3 } from "../../../datatypes/Vector3";

const IsTypingTarget = (Target: EventTarget | null): boolean => {
	if (!(Target instanceof HTMLElement)) return false;

	if (Target.isContentEditable) return true;

	return (
		Target.tagName === "INPUT" || Target.tagName === "TEXTAREA" || Target.tagName === "SELECT"
	);
};

const IsGuiTarget = (Target: EventTarget | null): boolean =>
	Target instanceof Element && Target.closest("[data-colossal-ui]") !== null;

/** `MouseEvent.button` -> `Enum.UserInputType`-style name. */
const MouseButtonType = (Button: number): UserInputType => {
	switch (Button) {
		case 0:
			return "MouseButton1";
		case 2:
			return "MouseButton2";
		case 1:
			return "MouseButton3";
		default:
			return "MouseButtonOther";
	}
};

export class WebInput implements IInput {
	private targetElement: HTMLElement;
	private keysDown: Set<string> = new Set();
	private mouseButtonsDown: Set<number> = new Set();
	// Inputs whose begin edge a GUI/text field consumed, so the matching end
	// edge is reported the same way even if focus moved in between.
	private processedKeys: Set<string> = new Set();
	private processedButtons: Set<number> = new Set();
	private listeners: Set<(Event: IInputEvent) => void> = new Set();
	private mousePosition: { X: number; Y: number } = { X: 0, Y: 0 };
	private isInitialized: boolean = false;

	constructor(targetElement: HTMLElement) {
		this.targetElement = targetElement;
	}

	public Initialize(): void {
		if (this.isInitialized) return;
		this.isInitialized = true;

		// Keyboard input belongs to the viewport, not the whole page: make the
		// mount focusable so a click can take focus, and listen for keys on it
		// rather than on `window`. Keys pressed while another editor panel is
		// focused then never reach the game.
		if (!this.targetElement.hasAttribute("tabindex")) {
			this.targetElement.tabIndex = -1;
		}

		document.addEventListener("pointerdown", this.onPointerDown, true);

		this.targetElement.addEventListener("keydown", this.onKeyDown);
		this.targetElement.addEventListener("keyup", this.onKeyUp);

		this.targetElement.addEventListener("mousedown", this.onMouseDown);
		window.addEventListener("mouseup", this.onMouseUp);
		this.targetElement.addEventListener("pointermove", this.onMouseMove);

		this.targetElement.addEventListener("focusout", this.onFocusOut);
		window.addEventListener("blur", this.onWindowBlur);
	}

	public IsKeyDown(key: string): boolean {
		return this.keysDown.has(key);
	}

	public IsMouseButtonDown(button: number): boolean {
		return this.mouseButtonsDown.has(button);
	}

	public GetMousePosition(): { X: number; Y: number } {
		return { X: this.mousePosition.X, Y: this.mousePosition.Y };
	}

	public Subscribe(Listener: (Event: IInputEvent) => void): () => void {
		this.listeners.add(Listener);

		return () => {
			this.listeners.delete(Listener);
		};
	}

	public Dispose(): void {
		if (!this.isInitialized) return;
		this.isInitialized = false;

		document.removeEventListener("pointerdown", this.onPointerDown, true);

		this.targetElement.removeEventListener("keydown", this.onKeyDown);
		this.targetElement.removeEventListener("keyup", this.onKeyUp);

		this.targetElement.removeEventListener("mousedown", this.onMouseDown);
		window.removeEventListener("mouseup", this.onMouseUp);
		this.targetElement.removeEventListener("pointermove", this.onMouseMove);

		this.targetElement.removeEventListener("focusout", this.onFocusOut);
		window.removeEventListener("blur", this.onWindowBlur);

		this.keysDown.clear();
		this.mouseButtonsDown.clear();
		this.processedKeys.clear();
		this.processedButtons.clear();
		this.listeners.clear();
	}

	private onKeyDown = (event: KeyboardEvent): void => {
		// Typing in a GUI text field must not drive game input. Key-up is still
		// recorded below so a key held before focusing cannot get stuck down.
		const Processed = IsTypingTarget(event.target);

		if (!Processed) this.keysDown.add(event.code);

		// Holding a key repeats keydown; InputBegan marks the edge, not repeats.
		if (event.repeat) return;

		if (Processed) this.processedKeys.add(event.code);
		else this.processedKeys.delete(event.code);

		this.Emit({
			UserInputType: "Keyboard",
			UserInputState: "Begin",
			KeyCode: event.code,
			Position: this.GetPositionVector(),
			Delta: new Vector3(0, 0, 0),
			GameProcessedEvent: Processed,
		});
	};

	private onKeyUp = (event: KeyboardEvent): void => {
		this.keysDown.delete(event.code);

		// End the edge the same way it began, then let the current target claim
		// it too (focus can move while a key is held).
		const Processed = this.processedKeys.delete(event.code) || IsTypingTarget(event.target);

		this.Emit({
			UserInputType: "Keyboard",
			UserInputState: "End",
			KeyCode: event.code,
			Position: this.GetPositionVector(),
			Delta: new Vector3(0, 0, 0),
			GameProcessedEvent: Processed,
		});
	};

	private onMouseDown = (event: MouseEvent): void => {
		this.UpdateMousePosition(event);

		// Clicks on interactive UI belong to the GUI, not to the camera/parts.
		const Processed = IsGuiTarget(event.target);

		if (!Processed) this.mouseButtonsDown.add(event.button);

		if (Processed) this.processedButtons.add(event.button);
		else this.processedButtons.delete(event.button);

		this.Emit({
			UserInputType: MouseButtonType(event.button),
			UserInputState: "Begin",
			KeyCode: null,
			Position: this.GetPositionVector(),
			Delta: new Vector3(0, 0, 0),
			GameProcessedEvent: Processed,
		});
	};

	private onMouseUp = (event: MouseEvent): void => {
		this.UpdateMousePosition(event);
		this.mouseButtonsDown.delete(event.button);

		const Processed = this.processedButtons.delete(event.button) || IsGuiTarget(event.target);

		this.Emit({
			UserInputType: MouseButtonType(event.button),
			UserInputState: "End",
			KeyCode: null,
			Position: this.GetPositionVector(),
			Delta: new Vector3(0, 0, 0),
			GameProcessedEvent: Processed,
		});
	};

	private onMouseMove = (event: MouseEvent): void => {
		this.UpdateMousePosition(event);
	};

	private onPointerDown = (event: PointerEvent): void => {
		const Target = event.target;

		if (!(Target instanceof Node) || !this.targetElement.contains(Target)) {
			// Clicking any other editor panel ends the viewport's input session.
			this.Deactivate();
			return;
		}

		// A GUI text field keeps its caret; clicking the game itself focuses the
		// viewport so subsequent keys reach the game.
		if (!IsTypingTarget(Target)) {
			this.targetElement.focus({ preventScroll: true });
		}

		// Keep a right-button camera drag alive when the pointer leaves the
		// viewport; the browser releases the capture on pointerup.
		if (event.button === 2 && !IsGuiTarget(Target)) {
			try {
				this.targetElement.setPointerCapture(event.pointerId);
			} catch {
				// Synthetic pointer events have no active pointer to capture.
			}
		}
	};

	private onFocusOut = (event: FocusEvent): void => {
		const Next = event.relatedTarget;

		// Focus moving to a GUI control inside the viewport (a TextBox) is still
		// viewport focus: its keys bubble here and are reported as processed.
		if (Next instanceof Node && this.targetElement.contains(Next)) return;

		this.ReleaseAll();
	};

	private onWindowBlur = (): void => {
		this.ReleaseAll();
	};

	/**
	 * Ends the viewport's input session. The click may have been prevented from
	 * moving focus (dockview does this while dragging), so drop focus explicitly
	 * as well as clearing state.
	 */
	private Deactivate(): void {
		const Active = document.activeElement;

		if (Active instanceof HTMLElement && this.targetElement.contains(Active)) {
			Active.blur();
		}

		this.ReleaseAll();
	}

	private ReleaseAll(): void {
		// The browser does not deliver releases when the viewport or window loses
		// focus, so end every held input rather than leaving it stuck down.
		for (const KeyCode of this.keysDown) {
			this.Emit({
				UserInputType: "Keyboard",
				UserInputState: "End",
				KeyCode,
				Position: this.GetPositionVector(),
				Delta: new Vector3(0, 0, 0),
				GameProcessedEvent: this.processedKeys.delete(KeyCode),
			});
		}

		for (const Button of this.mouseButtonsDown) {
			this.Emit({
				UserInputType: MouseButtonType(Button),
				UserInputState: "End",
				KeyCode: null,
				Position: this.GetPositionVector(),
				Delta: new Vector3(0, 0, 0),
				GameProcessedEvent: this.processedButtons.delete(Button),
			});
		}

		this.keysDown.clear();
		this.mouseButtonsDown.clear();
		this.processedKeys.clear();
		this.processedButtons.clear();
	}

	private UpdateMousePosition(event: MouseEvent): void {
		const rect = this.targetElement.getBoundingClientRect();

		this.mousePosition.X = event.clientX - rect.left;
		this.mousePosition.Y = event.clientY - rect.top;
	}

	private GetPositionVector(): Vector3 {
		return new Vector3(this.mousePosition.X, this.mousePosition.Y, 0);
	}

	private Emit(event: IInputEvent): void {
		for (const Listener of [...this.listeners]) {
			try {
				Listener(event);
			} catch (Error) {
				// One failing listener must not stop the others or the game.
				console.error("Input listener failed:", Error);
			}
		}
	}
}
