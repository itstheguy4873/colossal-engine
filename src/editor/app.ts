import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import {
    createDockview,
    DockviewApi,
    themeAbyss,
} from 'dockview-core';

import './windows';

import { Engine } from '../engine';
import { LitRenderer } from './core/LitRenderer';
import { LayoutManager } from './layouts/LayoutManager';

import dockviewStyles from 'dockview/dist/styles/dockview.css?inline';

import { WebBackend } from '../engine/web';

@customElement('main-app')
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

    @query('#dock') private dockEl!: HTMLElement;

    @state()
    engine?: Engine;

    private api?: DockviewApi;
    private layoutManager?: LayoutManager;
    
    async firstUpdated() {
        const sceneView = document.createElement('div');

        this.engine = new Engine(
            "Colossal Engine",
            new WebBackend(sceneView)
        );

        this.api = createDockview(this.dockEl, {
            theme: themeAbyss,
            createComponent: ({ name }) =>
                new LitRenderer(name, this),
        });

        this.layoutManager = new LayoutManager(this.api);
        this.layoutManager.loadOrDefault('default');

        await this.engine.Start();
    }

    disconnectedCallback() {
        this.api?.dispose();
        super.disconnectedCallback();
    }

    render() {
        return html`<div id="dock"></div>`;
    }
}