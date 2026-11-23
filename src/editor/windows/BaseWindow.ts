import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { Engine } from "../../engine";
import type { EditorContext } from "../core/EditorContext";

export abstract class BaseWindow extends LitElement {
	@property({ attribute: false })
	engine?: Engine;

	@property({ attribute: false })
	context!: EditorContext;

	abstract title: string;
}
