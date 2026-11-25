import type { ReactElement } from "react";
import type { TabData } from "rc-dock";

/**
 * A window is a stable identity plus a React view.
 *
 * Layout persistence stores only the `id`; `LayoutManager.loadTab` asks the
 * matching window for fresh `title`/`content` when a saved layout is restored.
 * Keeping `Render()` separate from the layout data is what allows the dock
 * library to be replaced without touching any window.
 */
export abstract class BaseWindow {
	public abstract readonly id: string;
	public abstract readonly title: string;

	public abstract Render(): ReactElement;

	public GetTab(): TabData {
		return {
			id: this.id,
			title: this.title,
			content: this.Render(),
			closable: false,
		};
	}
}
