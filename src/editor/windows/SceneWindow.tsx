import { html } from "lit";
import { customElement, query } from "lit/decorators.js";
import { BaseWindow } from "./BaseWindow";
import { sceneStyles } from "../style";

@customElement("scene-window")
export class SceneWindow extends BaseWindow {
	static styles = sceneStyles;

	@query("#viewport")
	private viewport!: HTMLDivElement;

	get title(): string {
		return this.engine?.Name ?? "Scene";
	}

	firstUpdated() {
		const rendererContainer = this.engine?.Viewport();

		if (!rendererContainer) return;

		this.viewport.appendChild(rendererContainer);
	}

	render() {
		return html` <div id="viewport"></div> `;
	}
}
