import type { DockviewApi } from "dockview-core";

export function loadDefaultLayout(api: DockviewApi) {
    api.addPanel({
        id: "explorer",
        component: "explorer-window",
        title: "Explorer",
    });
}