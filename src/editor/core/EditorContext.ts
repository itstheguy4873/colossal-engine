import type { Engine } from "../../engine";

export interface EditorContext {
	engine?: Engine;

	selectedInstance: any;

	setSelectedInstance(instance: any): void;

	addEventListener: EventTarget["addEventListener"];
	removeEventListener: EventTarget["removeEventListener"];
}

export class EditorContextImpl extends EventTarget implements EditorContext {
	engine?: Engine;

	selectedInstance: any = null;

	setSelectedInstance(instance: any) {
		this.selectedInstance = instance;

		this.dispatchEvent(
			new CustomEvent("selection-changed", {
				detail: { instance },
			}),
		);
	}
}
