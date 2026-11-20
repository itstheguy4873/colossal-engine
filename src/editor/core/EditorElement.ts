import type { DataModel } from "../../engine";
import { LitElement } from "lit";
import { property } from "lit/decorators.js";

/**
 * Base class for every editor element.
 *
 * The editor renders into the light DOM on purpose: dockview ships a
 * document-level stylesheet and mounts its drag overlays next to its own
 * container, so shadow roots would leave both the dock and the panel contents
 * unstyled. Light DOM also lets `src/editor/editor.css` style the chrome and
 * the widgets in one place.
 *
 * `dataModel` is assigned by the dock when it mounts a panel; widgets read the
 * shared project data from it instead of constructing their own.
 */
export abstract class EditorElement extends LitElement {
	@property({ attribute: false })
	public dataModel?: DataModel;

	protected createRenderRoot(): HTMLElement {
		return this;
	}
}
