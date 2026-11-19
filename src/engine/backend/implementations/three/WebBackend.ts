import { IBackend } from "../../interfaces/IBackend";
import { IRenderer } from "../../interfaces/IRenderer";
import { IInput } from "../../interfaces/IInput";
import { IAudio } from "../../interfaces/IAudio";
import { IGui } from "../../interfaces/IGui";

import { WebRenderer } from "./WebRenderer";
import { WebInput } from "./WebInput";
import { WebAudio } from "./WebAudio";
import { WebUi } from "./WebUi";

export class WebBackend implements IBackend {
	public Renderer: IRenderer;
	public Input: IInput;
	public Audio: IAudio;
	public Gui: IGui;

	constructor(container: HTMLElement) {
		this.Renderer = new WebRenderer(container);
		this.Input = new WebInput(container);
		this.Audio = new WebAudio();
		this.Gui = new WebUi(container);
	}

	public async Initialize(): Promise<void> {
		await Promise.all([this.Renderer.Initialize(), this.Audio.Initialize()]);

		this.Input.Initialize();
		this.Gui.Initialize();
	}

	public Dispose(): void {
		this.Renderer.Dispose();
		this.Input.Dispose();
		this.Audio.Dispose();
		this.Gui.Dispose();
	}
}
