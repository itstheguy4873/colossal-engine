import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { EditorElement } from "../core/EditorElement";

const rows = [
	{ label: "Name", value: "-" },
	{ label: "ClassName", value: "-" },
	{ label: "Parent", value: "-" },
	{ label: "Size", value: "-" },
	{ label: "CFrame", value: "-" },
	{ label: "Color", value: "-" },
];

/**
 * Placeholder table. Real rows come from a per-class property schema over the
 * selected instance; edits should go through a command stack rather than
 * assigning to the instance.
 */
@customElement("inspector-widget")
export class InspectorWidget extends EditorElement {
	protected render() {
		return html`
			<div class="inspector">
				<div class="inspector-header">No selection</div>
				<div class="inspector-source">
					${this.dataModel ? `DataModel: ${this.dataModel.Name}` : "No DataModel"}
				</div>

				${rows.map(
					(row) => html`
						<div class="inspector-row">
							<span class="inspector-label">${row.label}</span>
							<span class="inspector-value">${row.value}</span>
						</div>
					`,
				)}
			</div>
		`;
	}
}
