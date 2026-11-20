import { html } from "lit";
import type { TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { Instance } from "../../engine";
import { EditorElement } from "../core/EditorElement";

@customElement("hierarchy-widget")
export class HierarchyWidget extends EditorElement {
	@state()
	private Expanded = new Set<Instance>();

	@state()
	private Selected?: Instance;

	protected render() {
		const Workspace = this.dataModel?.GetService("Workspace");

		if (!Workspace) {
			return html`
				<div class="widget">
					<div class="widget-row">No DataModel</div>
				</div>
			`;
		}

		return html`
			<div class="widget treeview" role="tree">
				${this.RenderInstance(Workspace, 0)}
			</div>
		`;
	}

	private Toggle(Instance: Instance) {
		const Expanded = new Set(this.Expanded);

		if (Expanded.has(Instance)) {
			Expanded.delete(Instance);
		} else {
			Expanded.add(Instance);
		}

		this.Expanded = Expanded;
	}

	private RenderInstance(
		Instance: Instance,
		Depth: number,
	): TemplateResult {
		const Children = Instance.GetChildren();
		const HasChildren = Children.length > 0;
		const IsExpanded = this.Expanded.has(Instance);
		const IsSelected = this.Selected === Instance;

		return html`
			<div
				class="tree-node"
				role="treeitem"
				aria-expanded=${HasChildren ? IsExpanded : null}
				aria-selected=${IsSelected}
			>
				<div
					class="widget-row ${IsSelected ? "selected" : ""}"
					style="padding-left: ${Depth * 16 + 4}px"
					@click=${() => (this.Selected = Instance)}
				>
					<span
						class="tree-chevron ${HasChildren ? "" : "empty"}"
						@click=${(Event: Event) => {
							Event.stopPropagation();
							if (HasChildren) this.Toggle(Instance);
						}}
					>
						${HasChildren ? (IsExpanded ? "▾" : "▸") : ""}
					</span>

					<span class="tree-icon">O</span>

					<span class="tree-name">${Instance.Name}</span>
				</div>

				${HasChildren && IsExpanded
					? html`
							<div class="tree-children" role="group">
								${Children.map((Child) =>
									this.RenderInstance(Child, Depth + 1),
								)}
							</div>
						`
					: null}
			</div>
		`;
	}
}