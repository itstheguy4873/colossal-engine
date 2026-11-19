import { BaseService } from "./BaseService";
import type { IInput } from "../backend/interfaces/IInput";

export class UserInputService extends BaseService {
	public get ClassName(): string {
		return "UserInputService";
	}

	private Input: IInput | null = null;

	public Attach(Input: IInput): void {
		this.Input = Input;
	}

	public Detach(): void {
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
}
