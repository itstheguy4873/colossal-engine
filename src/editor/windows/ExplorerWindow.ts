import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("explorer-window")
export class ExplorerWindow extends LitElement {
    title = "Explorer";

    render() {
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