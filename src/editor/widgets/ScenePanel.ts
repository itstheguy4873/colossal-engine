import { html } from "lit";
import { customElement } from "lit/decorators.js";
import type { PropertyValues } from "lit";
import { Engine } from "../../engine";
import { WebBackend } from "../../engine/web";
import { EditorElement } from "../core/EditorElement";

/**
 * Renders the project's `DataModel` and owns the page's only engine.
 *
 * The scene contents belong to `EditorProject`, not to this widget: the engine
 * is bound to the shared model, so stopping it (closing the panel, a failed
 * start) never discards the world.
 *
 * Dockview can move panel content between containers, which briefly detaches
 * the element; the microtask checks keep a move from restarting the engine.
 */
@customElement("scene-widget")
export class SceneWidget extends EditorElement {
	private EngineInstance: Engine | null = null;
	private StartTask: Promise<void> | null = null;

	protected render() {
		return html`<div class="scene-host"></div>`;
	}

	protected updated(changed: PropertyValues<this>): void {
		if (!changed.has("dataModel") || !this.dataModel) return;

		void this.MountEngine();
	}

	public disconnectedCallback(): void {
		super.disconnectedCallback();

		queueMicrotask(() => {
			if (!this.isConnected) void this.UnmountEngine();
		});
	}

	private async MountEngine(): Promise<void> {
		const DataModel = this.dataModel;

		if (!DataModel || this.EngineInstance || this.StartTask) return;

		const Host = this.querySelector<HTMLElement>(".scene-host");

		if (!Host) return;

		const EngineInstance = new Engine(DataModel.Name, new WebBackend(Host), DataModel);

		this.EngineInstance = EngineInstance;

		const Started = EngineInstance.Start();
		this.StartTask = Started;

		try {
			await Started;
		} catch (Error) {
			console.error("Failed to start the engine.", Error);
		} finally {
			if (this.StartTask === Started) this.StartTask = null;
		}
	}

	private async UnmountEngine(): Promise<void> {
		const EngineInstance = this.EngineInstance;

		if (!EngineInstance) return;

		this.EngineInstance = null;

		// Stop() while Start() is still initializing would leave the frame loop
		// running, so wait for the start to settle first.
		if (this.StartTask) await this.StartTask.catch(() => undefined);

		EngineInstance.Stop();

		// A reconnect that landed while the stop was pending has no engine left.
		if (this.isConnected && this.dataModel) void this.MountEngine();
	}
}
