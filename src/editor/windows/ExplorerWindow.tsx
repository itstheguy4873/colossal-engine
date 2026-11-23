import { html, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { InstanceFactory, type Instance } from "../../engine";
import { BaseWindow } from "./BaseWindow";
import "../components/ContextMenu";
import type { ContextMenuGroup, ContextMenuSelectDetail } from "../components/ContextMenu";
import { ApplyIconFallback } from "../core/IconFallback";
import {
	BuildInstanceActionMenu,
	BuildMoveTargetMenu,
	IsProtectedInstance,
} from "../core/InstanceActions";
import { BuildInstanceInsertMenu } from "../core/InstanceInsertMenu";
import { explorerStyles } from "../style";

interface ExplorerMenu {
	instance: Instance;
	x: number;
	y: number;
	heading: string;
	groups: ContextMenuGroup[];
	moveTargets?: Instance[];
}

const ACTION_PREFIX = "action:";
const MOVE_PREFIX = "move:";

@customElement("explorer-window")
export class ExplorerWindow extends BaseWindow {
	title = "Explorer";

	@state()
	private expanded = new Set<Instance>();

	@state()
	private selected: Instance | null = null;

	@state()
	private revision = 0;

	@state()
	private dragging: Instance | null = null;

	@state()
	private dropTarget: Instance | null = null;

	@state()
	private menu: ExplorerMenu | null = null;

	@state()
	private renaming: Instance | null = null;

	@state()
	private draftName = "";

	private connections: any[] = [];
	private refreshQueued = false;
	private observed = new Set<Instance>();
	private expansionInitialized = false;

	connectedCallback() {
		super.connectedCallback();
		this.refreshSubscriptions();
	}

	disconnectedCallback() {
		this.disconnectAll();
		this.menu = null;
		super.disconnectedCallback();
	}

	updated(changed: Map<PropertyKey, unknown>) {
		if (changed.has("engine")) {
			this.menu = null;
			this.expansionInitialized = false;

			// `refreshSubscriptions` may initialize `expanded`, so run it after
			// this update instead of scheduling another update from inside it.
			queueMicrotask(() => {
				if (this.isConnected) this.refreshSubscriptions();
			});
		}

		// Focus the inline rename field once it exists. Re-running this while
		// the field already owns focus would select the text on every keystroke.
		if (this.renaming) {
			const input = this.renderRoot.querySelector<HTMLInputElement>(".rename");

			if (input && document.activeElement !== input) {
				input.focus();
				input.select();
			}
		}
	}

	private disconnectAll() {
		for (const connection of this.connections) {
			connection?.Disconnect?.();
		}

		this.connections = [];
		this.observed.clear();
	}

	private scheduleRefresh = () => {
		if (this.refreshQueued) return;

		this.refreshQueued = true;

		queueMicrotask(() => {
			this.refreshQueued = false;

			if (!this.isConnected) return;

			this.refreshSubscriptions();
			this.revision++;
		});
	};

	private refreshSubscriptions() {
		this.disconnectAll();

		const root = this.engine?.DataModel;
		if (!root) return;

		const observe = (instance: Instance) => {
			if (!instance || this.observed.has(instance)) return;

			this.observed.add(instance);

			const subscribe = (signal: any) => {
				if (typeof signal?.Connect !== "function") return;

				const connection = signal.Connect(this.scheduleRefresh);

				if (connection) {
					this.connections.push(connection);
				}
			};

			try {
				subscribe(instance.ChildAdded);
				subscribe(instance.ChildRemoved);

				for (const child of instance.GetChildren()) {
					observe(child);
				}
			} catch {
				// Instance may have been destroyed.
			}
		};

		observe(root);

		// Start with the DataModel expanded; a single collapsed root row makes
		// the panel look empty on first load.
		if (!this.expansionInitialized) {
			this.expansionInitialized = true;
			this.expanded = new Set([root]);
		}
	}

	private toggle(instance: Instance) {
		const next = new Set(this.expanded);

		if (next.has(instance)) {
			next.delete(instance);
		} else {
			next.add(instance);
		}

		this.expanded = next;
	}

	private select(instance: Instance) {
		this.selected = instance;
		this.context?.setSelectedInstance(instance);
	}

	private getChildren(instance: Instance): readonly Instance[] {
		try {
			return instance.GetChildren() ?? [];
		} catch {
			return [];
		}
	}

	private getIcon(instance: Instance): string {
		return `/class_icons/${instance.ClassName}.svg`;
	}

	/* Selection and inline rename ------------------------------------------ */

	private onRowClick(event: MouseEvent, instance: Instance) {
		this.select(instance);

		const tree = (event.currentTarget as HTMLElement).closest(".tree");

		if (tree instanceof HTMLElement) {
			tree.focus();
		}
	}

	private beginRename(instance: Instance) {
		const root = this.engine?.DataModel;

		if (!root || IsProtectedInstance(instance, root)) return;

		this.select(instance);
		this.renaming = instance;
		this.draftName = instance.Name;
	}

	private commitRename = () => {
		const instance = this.renaming;

		if (!instance) return;

		this.renaming = null;

		const name = this.draftName.trim();

		if (!name || name === instance.Name) return;

		instance.Name = name;
		this.scheduleRefresh();
	};

	private onRenameKeyDown = (event: KeyboardEvent) => {
		// The tree and window both listen for F2/Delete/Escape; keep those from
		// firing while the user is typing a name.
		event.stopPropagation();

		if (event.key === "Enter") {
			event.preventDefault();
			this.commitRename();
		} else if (event.key === "Escape") {
			event.preventDefault();
			this.renaming = null;
		}
	};

	/* Tree actions ---------------------------------------------------------- */

	private deleteInstance(instance: Instance) {
		const root = this.engine?.DataModel;

		if (!root || IsProtectedInstance(instance, root)) return;

		const parent = instance.Parent;

		try {
			instance.Parent = null;
			this.select(parent ?? root);
			this.scheduleRefresh();
		} catch (error) {
			console.error("Failed to delete instance:", error);
		}
	}

	private moveInstance(instance: Instance, destination: Instance) {
		try {
			instance.Parent = destination;
			this.expanded = new Set([...this.expanded, destination]);
			this.select(instance);
			this.scheduleRefresh();
		} catch (error) {
			console.error("Failed to move instance:", error);
		}
	}

	/* Context menus --------------------------------------------------------- */

	private openMenu(event: MouseEvent, instance: Instance) {
		event.preventDefault();
		event.stopPropagation();

		const root = this.engine?.DataModel;

		if (!root) return;

		this.select(instance);

		this.menu = {
			instance,
			x: event.clientX,
			y: event.clientY,
			heading: instance.Name,
			groups: [...BuildInstanceInsertMenu(instance), BuildInstanceActionMenu(instance, root)],
		};
	}

	private openInsertMenuAt(instance: Instance, x: number, y: number) {
		this.select(instance);

		this.menu = {
			instance,
			x,
			y,
			heading: `Insert into ${instance.Name}`,
			groups: BuildInstanceInsertMenu(instance),
		};
	}

	private onAddClick(event: MouseEvent, instance: Instance) {
		event.preventDefault();
		event.stopPropagation();

		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

		this.openInsertMenuAt(instance, rect.right, rect.bottom);
	}

	private onMenuClose = () => {
		this.menu = null;
	};

	private onMenuSelect = (event: CustomEvent<ContextMenuSelectDetail>) => {
		const menu = this.menu;

		if (!menu) return;

		this.menu = null;

		const id = event.detail.id;

		if (id.startsWith(ACTION_PREFIX)) {
			this.runAction(id.slice(ACTION_PREFIX.length), menu);
			return;
		}

		if (id.startsWith(MOVE_PREFIX)) {
			const destination = menu.moveTargets?.[Number(id.slice(MOVE_PREFIX.length))];

			if (destination) {
				this.moveInstance(menu.instance, destination);
			}

			return;
		}

		this.createInstance(id, menu.instance);
	};

	private createInstance(className: string, parent: Instance) {
		try {
			const child = InstanceFactory.Create(className, parent);

			this.expanded = new Set([...this.expanded, parent]);
			this.select(child);
			this.scheduleRefresh();
		} catch (error) {
			console.error(`Failed to create ${className}:`, error);
		}
	}

	private runAction(action: string, menu: ExplorerMenu) {
		switch (action) {
			case "rename":
				this.beginRename(menu.instance);
				break;
			case "delete":
				this.deleteInstance(menu.instance);
				break;
			case "move":
				this.openMoveMenu(menu.instance, menu.x, menu.y);
				break;
		}
	}

	private openMoveMenu(instance: Instance, x: number, y: number) {
		const root = this.engine?.DataModel;

		if (!root || IsProtectedInstance(instance, root)) return;

		const { groups, targets } = BuildMoveTargetMenu(instance, root);

		if (targets.length === 0) return;

		// The menu that fired `item-select` dispatches `menu-close` right after
		// that handler returns. Opening the destination menu in a microtask
		// keeps that close from clearing the new menu.
		queueMicrotask(() => {
			if (!this.isConnected) return;

			this.menu = {
				instance,
				x,
				y,
				heading: `Move ${instance.Name} to…`,
				groups,
				moveTargets: targets,
			};
		});
	}

	/* Keyboard navigation --------------------------------------------------- */

	private getVisibleRows(): Instance[] {
		const root = this.engine?.DataModel;
		const rows: Instance[] = [];

		if (!root) return rows;

		const walk = (instance: Instance) => {
			rows.push(instance);

			if (!this.expanded.has(instance)) return;

			for (const child of this.getChildren(instance)) {
				walk(child);
			}
		};

		walk(root);

		return rows;
	}

	private selectOffset(offset: number) {
		const rows = this.getVisibleRows();
		const index = this.selected ? rows.indexOf(this.selected) : -1;
		const next = rows[index + offset];

		if (next) {
			this.select(next);
		}
	}

	private onTreeKeyDown = (event: KeyboardEvent) => {
		const instance = this.selected;

		if (!instance || this.renaming) return;

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				this.selectOffset(1);
				break;
			case "ArrowUp":
				event.preventDefault();
				this.selectOffset(-1);
				break;
			case "ArrowRight":
				event.preventDefault();

				if (this.getChildren(instance).length > 0 && !this.expanded.has(instance)) {
					this.toggle(instance);
				} else {
					this.selectOffset(1);
				}
				break;
			case "ArrowLeft":
				event.preventDefault();

				if (this.expanded.has(instance) && this.getChildren(instance).length > 0) {
					this.toggle(instance);
				} else if (instance.Parent) {
					this.select(instance.Parent);
				}
				break;
			case "F2":
				event.preventDefault();
				this.beginRename(instance);
				break;
			case "Delete":
				event.preventDefault();
				this.deleteInstance(instance);
				break;
			case "Insert": {
				event.preventDefault();

				const row = this.renderRoot.querySelector<HTMLElement>(
					'.node-row[data-selected="true"]',
				);
				const rect = row?.getBoundingClientRect();

				this.openInsertMenuAt(instance, rect?.right ?? 200, rect?.bottom ?? 200);
				break;
			}
			case "Enter":
				event.preventDefault();

				if (this.getChildren(instance).length > 0) {
					this.toggle(instance);
				}
				break;
		}
	};

	/* Drag and drop --------------------------------------------------------- */

	private canDrop(dragged: Instance | null, target: Instance): boolean {
		const root = this.engine?.DataModel;

		if (!dragged || !root) return false;
		if (dragged === root) return false;
		if (dragged === target) return false;
		if (dragged.Parent === target) return false;

		// Prevent dropping an instance into itself or its descendants.
		let current: Instance | null = target;

		while (current) {
			if (current === dragged) return false;
			current = current.Parent;
		}

		return true;
	}

	private onDragStart(event: DragEvent, instance: Instance) {
		if (instance === this.engine?.DataModel) {
			event.preventDefault();
			return;
		}

		this.dragging = instance;

		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/plain", instance.Name ?? "");
		}
	}

	private onDragOver(event: DragEvent, instance: Instance) {
		event.preventDefault();
		event.stopPropagation();

		if (!this.canDrop(this.dragging, instance)) {
			this.dropTarget = null;

			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "none";
			}

			return;
		}

		this.dropTarget = instance;

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	}

	private onDragLeave(event: DragEvent, instance: Instance) {
		event.stopPropagation();

		if (this.dropTarget === instance) {
			this.dropTarget = null;
		}
	}

	private onDrop(event: DragEvent, target: Instance) {
		event.preventDefault();
		event.stopPropagation();

		const dragged = this.dragging;

		this.dragging = null;
		this.dropTarget = null;

		if (!dragged || !this.canDrop(dragged, target)) return;

		this.moveInstance(dragged, target);
	}

	private onDragEnd() {
		this.dragging = null;
		this.dropTarget = null;
	}

	/* Rendering ------------------------------------------------------------- */

	private renderNode(instance: Instance, depth = 0): TemplateResult {
		const children = this.getChildren(instance);
		const hasChildren = children.length > 0;
		const isExpanded = this.expanded.has(instance);
		const isSelected = this.selected === instance;
		const isDragging = this.dragging === instance;
		const isDropTarget = this.dropTarget === instance;
		const isRenaming = this.renaming === instance;

		return html`
			<div class="node">
				<div
					class=${[
						"node-row",
						isSelected ? "selected" : "",
						isDragging ? "dragging" : "",
						isDropTarget ? "drop-target" : "",
					].join(" ")}
					style="--depth: ${depth}"
					data-selected=${isSelected ? "true" : "false"}
					draggable=${instance !== this.engine?.DataModel && !isRenaming ? "true" : "false"}
					@click=${(event: MouseEvent) => this.onRowClick(event, instance)}
					@dragstart=${(event: DragEvent) => this.onDragStart(event, instance)}
					@dragend=${() => this.onDragEnd()}
					@dragover=${(event: DragEvent) => this.onDragOver(event, instance)}
					@dragleave=${(event: DragEvent) => this.onDragLeave(event, instance)}
					@drop=${(event: DragEvent) => this.onDrop(event, instance)}
					@contextmenu=${(event: MouseEvent) => this.openMenu(event, instance)}
				>
					<span
						class="arrow"
						@click=${(event: Event) => {
							event.stopPropagation();

							if (hasChildren) {
								this.toggle(instance);
							}
						}}
					>
						${hasChildren ? (isExpanded ? "▼" : "▶") : ""}
					</span>

					<img
						class="icon"
						src=${this.getIcon(instance)}
						alt=""
						@error=${ApplyIconFallback}
					/>

					${
						isRenaming
							? html`
									<input
										class="rename"
										type="text"
										.value=${this.draftName}
										@input=${(event: Event) => {
											this.draftName = (
												event.target as HTMLInputElement
											).value;
										}}
										@keydown=${this.onRenameKeyDown}
										@blur=${this.commitRename}
										@click=${(event: Event) => event.stopPropagation()}
									/>
								`
							: html`
									<span class="name">${instance.Name}</span>
									<span class="class-name">${instance.ClassName}</span>
								`
					}

					<button
						type="button"
						class="row-action"
						title=${`Insert into ${instance.Name}`}
						@click=${(event: MouseEvent) => this.onAddClick(event, instance)}
					>
						+
					</button>
				</div>

				${
					isExpanded && hasChildren
						? html`
								<div class="children">
									${children.map((child) => this.renderNode(child, depth + 1))}
								</div>
							`
						: ""
				}
			</div>
		`;
	}

	render() {
		void this.revision;

		const root = this.engine?.DataModel;

		if (!root) {
			return html` <div class="empty">No DataModel</div> `;
		}

		return html`
			<div class="explorer">
				<div class="tree" tabindex="0" @keydown=${this.onTreeKeyDown}>
					${this.renderNode(root)}
				</div>
			</div>
			${
				this.menu
					? html`
							<context-menu
								.x=${this.menu.x}
								.y=${this.menu.y}
								.heading=${this.menu.heading}
								.groups=${this.menu.groups}
								@item-select=${this.onMenuSelect}
								@menu-close=${this.onMenuClose}
							></context-menu>
						`
					: ""
			}
		`;
	}

	static styles = explorerStyles;
}
