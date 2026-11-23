import type { DockviewApi } from "dockview-core";

export function loadDefaultLayout(api: DockviewApi) {
	api.addPanel({
		id: "scene",
		component: "scene-window",
		title: "Scene",
	});

	api.addPanel({
		id: "explorer",
		component: "explorer-window",
		title: "Explorer",
		position: {
			referencePanel: "scene",
			direction: "right",
		},
	});

	api.addPanel({
		id: "properties",
		component: "properties-window",
		title: "Properties",
		position: {
			referencePanel: "explorer",
			direction: "below",
		},
	});
}
