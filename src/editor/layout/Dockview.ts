import "dockview/dist/styles/dockview.css";
import { createDockview, themeDark } from "dockview";
import type { AddPanelOptions, DockviewApi } from "dockview";
import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { EditorElement } from "../core/EditorElement";

/**
 * Hosts the dockview instance.
 *
 * Panels are plain custom elements: `addWidget` names the element tag to mount
 * and dockview loads it lazily, so widgets only exist while their panel does.
 * Calls made before the first render are buffered, which lets the app shell
 * describe the whole layout without waiting for this element to upgrade.
 */
@customElement("editor-dockview")
export class EditorDockview extends EditorElement {
	// `dataModel` is inherited from EditorElement: the app sets it before adding
	// widgets and `createComponent` copies it onto every panel it mounts.

	private api: DockviewApi | undefined;
	private pending: AddPanelOptions[] = [];
	private pendingActive: string | undefined;
	
	protected override render() {
		return html`
			<div
				class="dockview-host"
				@contextmenu=${(e: MouseEvent) => e.preventDefault()}
			></div>
		`;
	}

	protected firstUpdated(): void {
		const container = this.querySelector<HTMLElement>(".dockview-host");

		if (!container) throw new Error("editor-dockview is missing its container.");

		this.api = createDockview(container, {
			theme: themeDark,
			createComponent: (options) => {
				// A typo in a widget tag would otherwise render a silent empty panel.
				if (!customElements.get(options.name)) {
					throw new Error(`Unknown editor widget: <${options.name}>.`);
				}

				const element = document.createElement(options.name) as EditorElement;

				element.className = "editor-widget";
				element.dataModel = this.dataModel;

				return {
					element,
					init: () => undefined,
				};
			},
		});

		this.pending.splice(0).forEach((panel) => this.api?.addPanel(panel));

		const active = this.pendingActive;

		this.pendingActive = undefined;

		if (active) this.api.getPanel(active)?.api.setActive();
	}

	public disconnectedCallback(): void {
		super.disconnectedCallback();

		this.api?.dispose();
		this.api = undefined;
		this.pending = [];
	}

	/** Adds a docked panel, or buffers it until the dock exists. */
	public addWidget(panel: AddPanelOptions): void {
		if (!this.api) {
			this.pending.push(panel);
			return;
		}

		this.api.addPanel(panel);
	}

	public removeWidget(id: string): void {
		this.api?.getPanel(id)?.api.close();
	}

	/** Focuses a panel, or queues the focus until the dock exists. */
	public setActivePanel(id: string): void {
		if (!this.api) {
			this.pendingActive = id;
			return;
		}

		this.api.getPanel(id)?.api.setActive();
	}

	/** The serialized layout, for persistence; `undefined` before first render. */
	public toJSON(): ReturnType<DockviewApi["toJSON"]> | undefined {
		return this.api?.toJSON();
	}
}
