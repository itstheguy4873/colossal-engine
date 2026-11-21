import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { DockviewPanelApi } from "dockview-core";

@customElement("base-window")
export class BaseWindow extends LitElement {
	static styles = css`
		:host {
			display: block;
			height: 100%;
			padding: 12px;
			box-sizing: border-box;
		}
	`;

	@property({ type: String }) titleText = "Default Title";
	@property({ attribute: false }) panelApi?: DockviewPanelApi;

	render() {
		return html`
			<h3>${this.titleText}</h3>
			<button @click=${() => this.panelApi?.setTitle("Updated!")}>Rename Tab</button>
		`;
	}
}
