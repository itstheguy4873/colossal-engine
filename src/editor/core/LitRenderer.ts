import { type IContentRenderer, type GroupPanelPartInitParameters } from "dockview-core";

import { LitElement } from "lit";

export class LitRenderer implements IContentRenderer {
	readonly element: LitElement;

	constructor(tagName: string) {
		this.element = document.createElement(tagName) as LitElement;
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
}
