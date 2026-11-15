import { IInput } from "../../interfaces/IInput";

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
		this.keysDown.add(event.code);
	};

	private onKeyUp = (event: KeyboardEvent): void => {
		this.keysDown.delete(event.code);
	};

	private onMouseDown = (event: MouseEvent): void => {
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
