import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { BaseWindow } from "./BaseWindow";

@customElement("explorer-window")
export class ExplorerWindow extends BaseWindow {
	title = "Explorer";

	renderContent() {
		return html`
			<p>My file explorer</p>
			<ul>
				<li>Documents</li>
				<li>Pictures</li>
				<li>Projects</li>
			</ul>
		`;
	}
}
