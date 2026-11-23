import { LitElement, html, unsafeCSS } from "lit";
import { customElement, query } from "lit/decorators.js";
import { createDockview, themeDark } from "dockview-core";
import type { DockviewApi } from "dockview-core";

import "./windows";

import { Engine } from "../engine";
import { LitRenderer } from "./core/LitRenderer";
import { LayoutManager } from "./layouts/LayoutManager";

import { EditorContextImpl } from "./core/EditorContext";

import dockviewStyles from "dockview/dist/styles/dockview.css?inline";

import { WebBackend } from "../engine/web";
import { appStyles } from "./style";

@customElement("main-app")
export class App extends LitElement {
	static styles = [unsafeCSS(dockviewStyles), appStyles];

	@query("#dock") private dockEl!: HTMLElement;

	// Not reactive: `render()` does not read the engine. LitRenderer reads it
	// when it constructs each window, so a `@state` here only scheduled a
	// redundant update (and a dev-mode warning) after `firstUpdated`.
	engine?: Engine;

	private api?: DockviewApi;
	private layoutManager?: LayoutManager;
	private startTask?: Promise<void>;

	private context = new EditorContextImpl();

	async firstUpdated() {
		const sceneView = document.createElement("div");

		// Create engine
		this.engine = new Engine("Colossal Engine", new WebBackend(sceneView));

		// Share engine with all editor windows
		this.context.engine = this.engine;

		// Create Dockview
		this.api = createDockview(this.dockEl, {
			theme: themeDark,
			createComponent: ({ name }) => new LitRenderer(name, this.context),
		});

		// Initialize layout
		this.layoutManager = new LayoutManager(this.api);
		this.layoutManager.loadOrDefault("default");

		// Start engine
		this.startTask = this.engine.Start();

		await this.startTask;
	}

	disconnectedCallback() {
		const engine = this.engine;

		this.api?.dispose();
		super.disconnectedCallback();

		// `Engine.Stop()` is a no-op until `Start()` has finished, so wait for it
		// to settle. Otherwise a teardown during startup would be ignored and the
		// frame loop would keep rendering into a removed element.
		void (this.startTask ?? Promise.resolve()).then(() => engine?.Stop());
	}

	render() {
		return html`<div id="dock"></div>`;
	}
}
