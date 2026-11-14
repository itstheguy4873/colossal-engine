import { IRenderer } from "./IRenderer";
import { IInput } from "./IInput";
import { IAudio } from "./IAudio";

export interface IBackend {
    Renderer: IRenderer;
    Input: IInput;
    Audio: IAudio;

    Initialize(): Promise<void>;
    Dispose(): void;
}