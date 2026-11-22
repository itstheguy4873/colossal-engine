import {
    type IContentRenderer,
    type GroupPanelPartInitParameters,
} from 'dockview-core';

import type { EditorContext } from './EditorContext';

export class LitRenderer implements IContentRenderer {
    readonly element: HTMLElement;

    constructor(
        tagName: string,
        private context: EditorContext,
    ) {
        const WindowClass = customElements.get(tagName);

        if (!WindowClass) {
            throw new Error(
                `Window "${tagName}" has not been registered.`
            );
        }

        this.element = new WindowClass() as HTMLElement;

        Object.assign(this.element, {
            context: this.context,
            engine: this.context.engine,
        });
    }

    init(parameters: GroupPanelPartInitParameters): void {
        Object.assign(this.element, parameters.params, {
            panelApi: parameters.api,
            containerApi: parameters.containerApi,
            context: this.context,
            engine: this.context.engine,
        });
    }

    update(event: { params: Record<string, any> }): void {
        Object.assign(this.element, event.params);
    }

    dispose(): void {}
}