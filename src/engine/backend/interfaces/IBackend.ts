import { IRenderer } from "./IRenderer";
import { IInput } from "./IInput";
import { IAudio } from "./IAudio";
import { IGui } from "./IGui";

export interface IBackend {
	Renderer: IRenderer;
	Input: IInput;
	Audio: IAudio;
	Gui: IGui;

	Initialize(): Promise<void>;
	Dispose(): void;
}
