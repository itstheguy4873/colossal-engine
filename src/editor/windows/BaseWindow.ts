import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { DockviewPanelApi } from "dockview-core";

@customElement("base-window")
export class BaseWindow extends LitElement {
	@property({ type: String }) titleText = "Default Title";
	@property({ attribute: false }) panelApi?: DockviewPanelApi;

	render() {
		return html`<h1>Empty Window</h1>`;
	}
}
