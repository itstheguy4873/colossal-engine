import type { Engine } from "../../engine";
import * as Modules from "./modules";

/**
 * Editor-only behaviour that runs on top of the engine. Modules are bound to
 * the render loop so the engine itself stays free of editor controls.
 */
export class EditorLogic {
	private readonly ActiveModules: Modules.BaseModule[];

	constructor(Engine: Engine) {
		this.ActiveModules = [new Modules.CameraModule(Engine)];
	}

	public Start(): void {
		for (const Module of this.ActiveModules) {
			Module.BindCallback();
		}
	}

	public Stop(): void {
		for (const Module of this.ActiveModules) {
			Module.UnbindCallback();
		}
	}
}