
import { LitElement, html, css, unsafeCSS } from "lit";
import { customElement, query } from "lit/decorators.js";
import {
    createDockview,
    DockviewApi,
    themeAbyss,
} from "dockview-core";

import "./windows";

import { LitRenderer } from "./core/LitRenderer";
import dockviewStyles from "dockview/dist/styles/dockview.css?inline";

import { LayoutManager } from "./layouts/LayoutManager";

@customElement("main-app")
export class App extends LitElement {
    static styles = [
        unsafeCSS(dockviewStyles),
        css`
            :host {
                display: block;
                width: 100vw;
                height: 100vh;
                overflow: hidden;
            }

            #dock {
                width: 100%;
                height: 100%;
            }
        `,
    ];

    @query("#dock") private dockEl!: HTMLElement;

    private api?: DockviewApi;
    private layoutManager?: LayoutManager;
    private layoutDisposable?: { dispose: () => void };

    firstUpdated() {
        this.api = createDockview(this.dockEl, {
            theme: themeAbyss,
            createComponent: ({ name }) => new LitRenderer(name),
        });

        this.layoutManager = new LayoutManager(this.api);

        this.layoutManager.loadOrDefault("default");

        this.layoutDisposable = this.api.onDidLayoutChange(() => {
            this.layoutManager?.save("default");
        });
    }

    disconnectedCallback() {
        this.layoutDisposable?.dispose();
        this.api?.dispose();

        super.disconnectedCallback();
    }

    saveLayout(name: string) {
        this.layoutManager?.save(name);
    }

    loadLayout(name: string) {
        this.layoutManager?.loadOrDefault(name);
    }

    render() {
        return html`
            <div id="dock"></div>
        `;
    }
}
