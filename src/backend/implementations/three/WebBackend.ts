import { IBackend } from "../../interfaces/IBackend";
import { IRenderer } from "../../interfaces/IRenderer";
import { IInput } from "../../interfaces/IInput";
import { IAudio } from "../../interfaces/IAudio";

import { WebRenderer } from "./WebRenderer";
import { WebInput } from "./WebInput";
import { WebAudio } from "./WebAudio";

export class WebBackend implements IBackend {
    public Renderer: IRenderer;
    public Input: IInput;
    public Audio: IAudio;

    constructor(container: HTMLElement) {
        this.Renderer = new WebRenderer(container);
        this.Input = new WebInput(container);
        this.Audio = new WebAudio();
    }

    public async Initialize(): Promise<void> {
        await Promise.all([
            this.Renderer.Initialize(),
            this.Audio.Initialize()
        ]);

        this.Input.Initialize();
    }

    public Dispose(): void {
        this.Renderer.Dispose();
        this.Input.Dispose();
        this.Audio.Dispose();
    }
}