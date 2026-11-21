
import {
    type IContentRenderer,
    type GroupPanelPartInitParameters,
} from "dockview-core";

export class LitRenderer implements IContentRenderer {
    readonly element: HTMLElement;

    constructor(tagName: string) {
        const WindowClass = customElements.get(tagName);

        if (!WindowClass) {
            throw new Error(
                `Window "${tagName}" has not been registered.`
            );
        }

        this.element = new WindowClass() as HTMLElement;
    }

    init(parameters: GroupPanelPartInitParameters): void {
        Object.assign(this.element, parameters.params, {
            panelApi: parameters.api,
            containerApi: parameters.containerApi,
        });
    }

    update(event: { params: Record<string, any> }): void {
        Object.assign(this.element, event.params);
    }

    dispose(): void {}
}
