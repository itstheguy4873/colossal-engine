import type { Engine } from "../../engine";

export interface EditorContext {
	engine?: Engine;

	selectedInstance: any;

	setSelectedInstance(instance: any): void;

	subscribe(listener: () => void): () => void;

	getSelectedInstance(): any;

	addEventListener: EventTarget["addEventListener"];
	removeEventListener: EventTarget["removeEventListener"];
}

export class EditorContextImpl extends EventTarget implements EditorContext {
	engine?: Engine;

	selectedInstance: any = null;

	public setSelectedInstance(instance: any) {
		this.selectedInstance = instance;

		this.dispatchEvent(
			new CustomEvent("selection-changed", {
				detail: { instance },
			}),
		);
	}

	public subscribe = (listener: () => void): (() => void) => {
		const handler = () => listener();

		this.addEventListener("selection-changed", handler);

		return () => this.removeEventListener("selection-changed", handler);
	};

	public getSelectedInstance = (): any => this.selectedInstance;
}
