import { LitElement, html, css, unsafeCSS } from "lit";
import { customElement, query } from "lit/decorators.js";
import { createDockview, DockviewApi, themeAbyss } from "dockview-core";

import { LitRenderer } from "./core/LitRenderer";
import dockviewStyles from "dockview/dist/styles/dockview.css?inline";

@customElement("main-app")
export class App extends LitElement {
	static styles = [
		unsafeCSS(dockviewStyles),
		css`
			:host {
				display: block;
				width: 100vw;
				height: 100vh;
				overflow: hidden;
			}
			#dock {
				width: 100%;
				height: 100%;
			}
		`,
	];

	@query("#dock") private dockEl!: HTMLElement;
	private api?: DockviewApi;

	firstUpdated() {
		this.api = createDockview(this.dockEl, {
			theme: themeAbyss,
			createComponent: ({ name }) => new LitRenderer(name),
		});

		this.api.addPanel({
			id: "panel-2",
			component: "lit-sample-panel",
			title: "Inspector",
			position: { referencePanel: "panel-1", direction: "right" },
			params: { message: "Right Panel", count: 5 },
		});
	}

	render() {
		return html`<div id="dock"></div>`;
	}
}
