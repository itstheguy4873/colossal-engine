import { html } from "lit";
import { customElement } from "lit/decorators.js";
import "../layout/Dockview";
import type { EditorDockview } from "../layout/Dockview";
import "../widgets";
import { EditorElement } from "./EditorElement";
import { EditorProject } from "./EditorProject";
import "../editor.css";

/**
 * Editor composition root.
 *
 * The boot layout is declared here rather than in a data file: three panels is
 * not enough structure to justify a parser, and the dock can already serialize
 * itself with `EditorDockview.toJSON()` for persistence later.
 */
@customElement("editor-app")
export class EditorApp extends EditorElement {
	private readonly project = new EditorProject();

	protected render() {
		return html`<editor-dockview></editor-dockview>`;
	}

	protected firstUpdated(): void {
		const dock = this.querySelector<EditorDockview>("editor-dockview");

		if (!dock) throw new Error("editor-app is missing its dock view.");

		// The project owns the DataModel; every widget is handed the same one.
		dock.dataModel = this.project.DataModel;

		// The scene owns the page's only engine, so its DOM must survive tab
		// switches; `renderer: "always"` keeps the element mounted while hidden.
		dock.addWidget({
			id: "scene",
			title: this.project.DataModel.Name,
			component: "scene-widget",
			renderer: "always",
		});

		dock.addWidget({
			id: "explorer",
			title: "Explorer",
			component: "explorer-widget",
			position: { direction: "left" },
			initialWidth: 260,
			inactive: true,
		});

		dock.addWidget({
			id: "properties",
			title: "Properties",
			component: "properties-widget",
			position: { direction: "right" },
			initialWidth: 300,
			inactive: true,
		});

		dock.setActivePanel("scene");
	}
}
