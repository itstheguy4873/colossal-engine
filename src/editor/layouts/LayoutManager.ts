
import type { DockviewApi } from "dockview-core";
import { loadDefaultLayout } from "./DefaultLayout";

export class LayoutManager {
    constructor(private api: DockviewApi) {}

    save(name: string) {
        const layout = this.api.toJSON();

        localStorage.setItem(
            `dockview-layout-${name}`,
            JSON.stringify(layout)
        );
    }

    load(name: string): boolean {
        const saved = localStorage.getItem(
            `dockview-layout-${name}`
        );

        if (!saved) return false;

        try {
            this.api.fromJSON(JSON.parse(saved), {
                reuseExistingPanels: false
            });

            return true;
        } catch (error) {
            console.error("Failed to load layout:", error);
            return false;
        }
    }

    loadDefault() {
        this.api.clear();
        loadDefaultLayout(this.api);
    }

    loadOrDefault(name: string) {
        if (!this.load(name)) {
            this.loadDefault();
        }
    }
}