import { IInput } from "../../interfaces/IInput";

const IsTypingTarget = (Target: EventTarget | null): boolean => {
	if (!(Target instanceof HTMLElement)) return false;

	if (Target.isContentEditable) return true;

	return (
		Target.tagName === "INPUT" || Target.tagName === "TEXTAREA" || Target.tagName === "SELECT"
	);
};

const IsGuiTarget = (Target: EventTarget | null): boolean =>
	Target instanceof Element && Target.closest("[data-colossal-ui]") !== null;

export class WebInput implements IInput {
	private targetElement: HTMLElement;
	private keysDown: Set<string> = new Set();
	private mouseButtonsDown: Set<number> = new Set();
	private mousePosition: { X: number; Y: number } = { X: 0, Y: 0 };
	private isInitialized: boolean = false;

	constructor(targetElement: HTMLElement) {
		this.targetElement = targetElement;
	}

	public Initialize(): void {
		if (this.isInitialized) return;
		this.isInitialized = true;

		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);

		this.targetElement.addEventListener("mousedown", this.onMouseDown);
		window.addEventListener("mouseup", this.onMouseUp);
		this.targetElement.addEventListener("mousemove", this.onMouseMove);

		window.addEventListener("blur", this.onBlur);
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

	public Dispose(): void {
		if (!this.isInitialized) return;
		this.isInitialized = false;

		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);

		this.targetElement.removeEventListener("mousedown", this.onMouseDown);
		window.removeEventListener("mouseup", this.onMouseUp);
		this.targetElement.removeEventListener("mousemove", this.onMouseMove);

		window.removeEventListener("blur", this.onBlur);

		this.keysDown.clear();
		this.mouseButtonsDown.clear();
	}

	private onKeyDown = (event: KeyboardEvent): void => {
		// Typing in a GUI text field must not drive game input. Key-up is still
		// recorded below so a key held before focusing cannot get stuck down.
		if (IsTypingTarget(event.target)) return;

		this.keysDown.add(event.code);
	};

	private onKeyUp = (event: KeyboardEvent): void => {
		this.keysDown.delete(event.code);
	};

	private onMouseDown = (event: MouseEvent): void => {
		// Clicks on interactive UI belong to the GUI, not to the camera/parts.
		if (IsGuiTarget(event.target)) return;

		this.mouseButtonsDown.add(event.button);
	};

	private onMouseUp = (event: MouseEvent): void => {
		this.mouseButtonsDown.delete(event.button);
	};

	private onMouseMove = (event: MouseEvent): void => {
		const rect = this.targetElement.getBoundingClientRect();
		this.mousePosition.X = event.clientX - rect.left;
		this.mousePosition.Y = event.clientY - rect.top;
	};

	private onBlur = (): void => {
		this.keysDown.clear();
		this.mouseButtonsDown.clear();
	};
}
