import type { LayoutBase, LayoutData, TabBase, TabData } from "rc-dock";
import type { BaseWindow } from "../windows/BaseWindow";
import { ExplorerWindow } from "../windows/ExplorerWindow";
import { PropertiesWindow } from "../windows/PropertiesWindow";
import { SceneWindow } from "../windows/SceneWindow";

const STORAGE_KEY = "ce-app-layout";

/**
 * Owns the window catalogue and the thin bridge between rc-dock's serialized
 * layout and React content.
 *
 * The persisted layout only holds tab ids. Every id here has exactly one
 * window, so a saved layout can be rehydrated after a reload and a stale id
 * cannot keep a React tree alive.
 */
export class LayoutManager {
	private readonly scene: SceneWindow;
	private readonly explorer = new ExplorerWindow();
	private readonly properties = new PropertiesWindow();
	private readonly windows: BaseWindow[];
	private readonly windowMap: Map<string, BaseWindow>;

	public constructor(sceneTitle = "Scene") {
		this.scene = new SceneWindow(sceneTitle);
		this.windows = [this.scene, this.explorer, this.properties];
		this.windowMap = new Map(this.windows.map((window) => [window.id, window]));
	}

	/** rc-dock callback: rebuild a tab's React content from its stored id. */
	public LoadTab = (tab: TabBase): TabData => {
		const window = this.windowMap.get(tab.id ?? "");

		if (!window) {
			return {
				...tab,
				id: tab.id ?? "unknown",
				title: "Unknown",
				content: <div className="ce-empty">This window is no longer available.</div>,
				closable: true,
			};
		}

		return { ...tab, ...window.GetTab() };
	};

	/** rc-dock callback: persist identity, never React content. */
	public SaveTab = (tab: TabData): TabBase => ({ id: tab.id });

	public LoadLayout(): LayoutData {
		const saved = this.LoadSavedLayout();

		if (saved) {
			const restored = this.RestoreWindowContent(saved);

			if (restored) return restored;
		}

		this.ClearLayout();

		return this.LoadDefaultLayout();
	}

	public LoadDefaultLayout(): LayoutData {
		return {
			dockbox: {
				mode: "horizontal",
				children: [
					this.CreatePanel(760, this.scene),
					{
						mode: "vertical",
						size: 340,
						children: [
							this.CreatePanel(460, this.explorer),
							this.CreatePanel(320, this.properties),
						],
					},
				],
			},
		};
	}

	public SaveLayout(layout: LayoutBase): void {
		try {
			const serialized = JSON.stringify(layout, (key, value) => {
				if (key === "content" || typeof value === "function") return undefined;

				return value;
			});

			localStorage.setItem(STORAGE_KEY, serialized);
		} catch (error) {
			console.error("Failed to save editor layout:", error);
		}
	}

	public ClearLayout(): void {
		localStorage.removeItem(STORAGE_KEY);
	}

	private CreatePanel(size: number, window: BaseWindow) {
		return {
			size,
			tabs: [window.GetTab()],
		};
	}

	private LoadSavedLayout(): LayoutData | null {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);

			if (!saved) return null;

			const layout = JSON.parse(saved) as LayoutData;

			return layout?.dockbox ? layout : null;
		} catch (error) {
			console.error("Failed to load editor layout:", error);
			return null;
		}
	}

	/**
	 * Rebuild tabs from the window catalogue and reject layouts that would lose
	 * a core window. There is no reopen-window UI, so a partial layout is worse
	 * than the default one. Floating and maximized boxes are dropped because
	 * the editor does not expose those modes.
	 */
	private RestoreWindowContent(layout: LayoutData): LayoutData | null {
		const seen = new Set<string>();

		const restoreNode = (node: any): any => {
			if (Array.isArray(node?.tabs)) {
				const tabs: TabData[] = [];

				for (const tab of node.tabs) {
					const window = this.windowMap.get(tab?.id);

					if (!window || seen.has(window.id)) continue;

					seen.add(window.id);
					tabs.push(window.GetTab());
				}

				if (tabs.length === 0) return null;

				return {
					...node,
					tabs,
					activeId: tabs.some((tab) => tab.id === node.activeId)
						? node.activeId
						: tabs[0].id,
				};
			}

			if (Array.isArray(node?.children)) {
				const children = node.children
					.map(restoreNode)
					.filter((child: any) => child !== null);

				if (children.length === 0) return null;

				return { ...node, children };
			}

			return null;
		};

		const dockbox = restoreNode(layout.dockbox);

		if (!dockbox || seen.size !== this.windows.length) return null;

		return { dockbox };
	}
}
