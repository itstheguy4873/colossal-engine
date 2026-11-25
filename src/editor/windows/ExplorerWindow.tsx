import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type DragEvent as ReactDragEvent,
	type KeyboardEvent as ReactKeyboardEvent,
	type MouseEvent as ReactMouseEvent,
} from "react";
import { InstanceFactory, type Instance } from "../../engine";
import { BaseWindow } from "./BaseWindow";
import { ContextMenu, type ContextMenuGroup } from "../components/ContextMenu";
import { ApplyIconFallback } from "../core/IconFallback";
import {
	BuildInstanceActionMenu,
	BuildMoveTargetMenu,
	IsProtectedInstance,
} from "../core/InstanceActions";
import { BuildInstanceInsertMenu } from "../core/InstanceInsertMenu";
import { useEditor, useSelectedInstance } from "../core/EditorProvider";

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

export class ExplorerWindow extends BaseWindow {
	public readonly id = "explorer";
	public readonly title = "Explorer";

	public Render() {
		return <ExplorerView />;
	}
}

function ExplorerView() {
	const { engine, context } = useEditor();
	const selected = useSelectedInstance();
	const root = engine.DataModel;

	const [expanded, setExpanded] = useState<Set<Instance>>(() => new Set([root]));
	const [, setRevision] = useState(0);
	const [dragging, setDragging] = useState<Instance | null>(null);
	const [dropTarget, setDropTarget] = useState<Instance | null>(null);
	const [menu, setMenu] = useState<ExplorerMenu | null>(null);
	const [renaming, setRenaming] = useState<Instance | null>(null);
	const [draftName, setDraftName] = useState("");

	const treeRef = useRef<HTMLDivElement>(null);
	const renameRef = useRef<HTMLInputElement>(null);
	const renamingRef = useRef<Instance | null>(null);
	const draftNameRef = useRef("");
	const connectionsRef = useRef<any[]>([]);
	const observedRef = useRef(new Set<Instance>());
	const refreshQueuedRef = useRef(false);
	const refreshRef = useRef<() => void>(() => {});
	const mountedRef = useRef(true);

	const disconnectAll = useCallback(() => {
		for (const connection of connectionsRef.current) {
			connection?.Disconnect?.();
		}

		connectionsRef.current = [];
		observedRef.current.clear();
	}, []);

	const scheduleRefresh = useCallback(() => {
		if (refreshQueuedRef.current) return;

		refreshQueuedRef.current = true;

		queueMicrotask(() => {
			refreshQueuedRef.current = false;

			if (!mountedRef.current) return;

			refreshRef.current();
			setRevision((current) => current + 1);
		});
	}, []);

	const refreshSubscriptions = useCallback(() => {
		disconnectAll();

		const observe = (instance: Instance) => {
			if (observedRef.current.has(instance)) return;

			observedRef.current.add(instance);

			const subscribe = (signal: any) => {
				if (typeof signal?.Connect !== "function") return;

				const connection = signal.Connect(scheduleRefresh);

				if (connection) {
					connectionsRef.current.push(connection);
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
	}, [disconnectAll, root, scheduleRefresh]);

	useEffect(() => {
		mountedRef.current = true;
		refreshRef.current = refreshSubscriptions;
		refreshSubscriptions();

		return () => {
			mountedRef.current = false;
			disconnectAll();
		};
	}, [disconnectAll, refreshSubscriptions]);

	useEffect(() => {
		if (!renaming) return;

		const input = renameRef.current;

		if (input && document.activeElement !== input) {
			input.focus();
			input.select();
		}
	}, [renaming]);

	const toggle = (instance: Instance) => {
		setExpanded((current) => {
			const next = new Set(current);

			if (next.has(instance)) {
				next.delete(instance);
			} else {
				next.add(instance);
			}

			return next;
		});
	};

	const select = useCallback(
		(instance: Instance) => {
			context.setSelectedInstance(instance);
		},
		[context],
	);

	const getChildren = (instance: Instance): readonly Instance[] => {
		try {
			return instance.GetChildren() ?? [];
		} catch {
			return [];
		}
	};

	const beginRename = (instance: Instance) => {
		if (IsProtectedInstance(instance, root)) return;

		select(instance);
		renamingRef.current = instance;
		draftNameRef.current = instance.Name;
		setRenaming(instance);
		setDraftName(instance.Name);
	};

	const cancelRename = () => {
		renamingRef.current = null;
		setRenaming(null);
	};

	const commitRename = () => {
		const instance = renamingRef.current;

		if (!instance) return;

		renamingRef.current = null;
		setRenaming(null);

		const name = draftNameRef.current.trim();

		if (!name || name === instance.Name) return;

		instance.Name = name;
		scheduleRefresh();
	};

	const onRenameKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
		// The tree listens for F2/Delete/Escape; keep those from firing while the
		// user is typing a name.
		event.stopPropagation();

		if (event.key === "Enter") {
			event.preventDefault();
			commitRename();
		} else if (event.key === "Escape") {
			event.preventDefault();
			cancelRename();
		}
	};

	const deleteInstance = (instance: Instance) => {
		if (IsProtectedInstance(instance, root)) return;

		const parent = instance.Parent;

		try {
			instance.Parent = null;
			select(parent ?? root);
			scheduleRefresh();
		} catch (error) {
			console.error("Failed to delete instance:", error);
		}
	};

	const moveInstance = (instance: Instance, destination: Instance) => {
		try {
			instance.Parent = destination;
			setExpanded((current) => new Set([...current, destination]));
			select(instance);
			scheduleRefresh();
		} catch (error) {
			console.error("Failed to move instance:", error);
		}
	};

	const openMenu = (event: ReactMouseEvent, instance: Instance) => {
		event.preventDefault();
		event.stopPropagation();

		select(instance);

		setMenu({
			instance,
			x: event.clientX,
			y: event.clientY,
			heading: instance.Name,
			groups: [...BuildInstanceInsertMenu(instance), BuildInstanceActionMenu(instance, root)],
		});
	};

	const openInsertMenuAt = (instance: Instance, x: number, y: number) => {
		select(instance);

		setMenu({
			instance,
			x,
			y,
			heading: `Insert into ${instance.Name}`,
			groups: BuildInstanceInsertMenu(instance),
		});
	};

	const onAddClick = (event: ReactMouseEvent<HTMLButtonElement>, instance: Instance) => {
		event.preventDefault();
		event.stopPropagation();

		const rect = event.currentTarget.getBoundingClientRect();

		openInsertMenuAt(instance, rect.right, rect.bottom);
	};

	const createInstance = (className: string, parent: Instance) => {
		try {
			const child = InstanceFactory.Create(className, parent);

			setExpanded((current) => new Set([...current, parent]));
			select(child);
			scheduleRefresh();
		} catch (error) {
			console.error(`Failed to create ${className}:`, error);
		}
	};

	const handleMenuSelect = (id: string) => {
		const current = menu;

		if (!current) return;

		if (id.startsWith(ACTION_PREFIX)) {
			const action = id.slice(ACTION_PREFIX.length);

			if (action === "rename") {
				setMenu(null);
				beginRename(current.instance);
				return;
			}

			if (action === "delete") {
				setMenu(null);
				deleteInstance(current.instance);
				return;
			}

			if (action === "move") {
				if (IsProtectedInstance(current.instance, root)) {
					setMenu(null);
					return;
				}

				const { groups, targets } = BuildMoveTargetMenu(current.instance, root);

				if (targets.length === 0) {
					setMenu(null);
					return;
				}

				setMenu({
					...current,
					heading: `Move ${current.instance.Name} to…`,
					groups,
					moveTargets: targets,
				});
				return;
			}

			setMenu(null);
			return;
		}

		if (id.startsWith(MOVE_PREFIX)) {
			const destination = current.moveTargets?.[Number(id.slice(MOVE_PREFIX.length))];

			setMenu(null);

			if (destination) {
				moveInstance(current.instance, destination);
			}

			return;
		}

		setMenu(null);
		createInstance(id, current.instance);
	};

	const getVisibleRows = (): Instance[] => {
		const rows: Instance[] = [];

		const walk = (instance: Instance) => {
			rows.push(instance);

			if (!expanded.has(instance)) return;

			for (const child of getChildren(instance)) {
				walk(child);
			}
		};

		walk(root);

		return rows;
	};

	const selectOffset = (offset: number) => {
		const rows = getVisibleRows();
		const index = selected ? rows.indexOf(selected) : -1;
		const next = rows[index + offset];

		if (next) {
			select(next);
		}
	};

	const onTreeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
		const instance = selected;

		if (!instance || renaming) return;

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				selectOffset(1);
				break;
			case "ArrowUp":
				event.preventDefault();
				selectOffset(-1);
				break;
			case "ArrowRight":
				event.preventDefault();

				if (getChildren(instance).length > 0 && !expanded.has(instance)) {
					toggle(instance);
				} else {
					selectOffset(1);
				}
				break;
			case "ArrowLeft":
				event.preventDefault();

				if (expanded.has(instance) && getChildren(instance).length > 0) {
					toggle(instance);
				} else if (instance.Parent) {
					select(instance.Parent);
				}
				break;
			case "F2":
				event.preventDefault();
				beginRename(instance);
				break;
			case "Delete":
				event.preventDefault();
				deleteInstance(instance);
				break;
			case "Insert": {
				event.preventDefault();

				const row = treeRef.current?.querySelector<HTMLElement>(
					'.ce-node-row[data-selected="true"]',
				);
				const rect = row?.getBoundingClientRect();

				openInsertMenuAt(instance, rect?.right ?? 200, rect?.bottom ?? 200);
				break;
			}
			case "Enter":
				event.preventDefault();

				if (getChildren(instance).length > 0) {
					toggle(instance);
				}
				break;
		}
	};

	const canDrop = (dragged: Instance | null, target: Instance): boolean => {
		if (!dragged) return false;
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
	};

	const onDragStart = (event: ReactDragEvent<HTMLDivElement>, instance: Instance) => {
		if (instance === root) {
			event.preventDefault();
			return;
		}

		setDragging(instance);

		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/plain", instance.Name ?? "");
		}
	};

	const onDragOver = (event: ReactDragEvent<HTMLDivElement>, instance: Instance) => {
		event.preventDefault();
		event.stopPropagation();

		if (!canDrop(dragging, instance)) {
			setDropTarget(null);

			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "none";
			}

			return;
		}

		setDropTarget(instance);

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	};

	const onDragLeave = (event: ReactDragEvent<HTMLDivElement>, instance: Instance) => {
		event.stopPropagation();

		if (dropTarget === instance) {
			setDropTarget(null);
		}
	};

	const onDrop = (event: ReactDragEvent<HTMLDivElement>, target: Instance) => {
		event.preventDefault();
		event.stopPropagation();

		const dragged = dragging;

		setDragging(null);
		setDropTarget(null);

		if (!dragged || !canDrop(dragged, target)) return;

		moveInstance(dragged, target);
	};

	const onDragEnd = () => {
		setDragging(null);
		setDropTarget(null);
	};

	const renderNode = (instance: Instance, depth = 0, key = "root") => {
		const children = getChildren(instance);
		const hasChildren = children.length > 0;
		const isExpanded = expanded.has(instance);
		const isSelected = selected === instance;
		const isDragging = dragging === instance;
		const isDropTarget = dropTarget === instance;
		const isRenaming = renaming === instance;

		const rowClass = [
			"ce-node-row",
			isSelected ? "selected" : "",
			isDragging ? "dragging" : "",
			isDropTarget ? "drop-target" : "",
		]
			.filter(Boolean)
			.join(" ");

		return (
			<div className="ce-node" key={key}>
				<div
					className={rowClass}
					style={{ "--depth": depth } as CSSProperties}
					data-selected={isSelected ? "true" : "false"}
					draggable={instance !== root && !isRenaming}
					onClick={(event) => {
						select(instance);
						treeRef.current?.focus();
						event.stopPropagation();
					}}
					onDragStart={(event) => onDragStart(event, instance)}
					onDragEnd={onDragEnd}
					onDragOver={(event) => onDragOver(event, instance)}
					onDragLeave={(event) => onDragLeave(event, instance)}
					onDrop={(event) => onDrop(event, instance)}
					onContextMenu={(event) => openMenu(event, instance)}
				>
					<span
						className="ce-arrow"
						onClick={(event) => {
							event.stopPropagation();

							if (hasChildren) {
								toggle(instance);
							}
						}}
					>
						{hasChildren ? (isExpanded ? "▼" : "▶") : ""}
					</span>

					<img
						className="ce-icon"
						src={`/class_icons/${instance.ClassName}.svg`}
						alt=""
						onError={ApplyIconFallback}
					/>

					{isRenaming ? (
						<input
							ref={renameRef}
							className="ce-rename"
							type="text"
							value={draftName}
							onChange={(event) => {
								draftNameRef.current = event.target.value;
								setDraftName(event.target.value);
							}}
							onKeyDown={onRenameKeyDown}
							onBlur={commitRename}
							onClick={(event) => event.stopPropagation()}
						/>
					) : (
						<>
							<span className="ce-name">{instance.Name}</span>
							<span className="ce-class-name">{instance.ClassName}</span>
						</>
					)}

					<button
						type="button"
						className="ce-row-action"
						title={`Insert into ${instance.Name}`}
						onClick={(event) => onAddClick(event, instance)}
					>
						+
					</button>
				</div>

				{isExpanded && hasChildren ? (
					<div className="ce-children">
						{children.map((child, index) =>
							renderNode(child, depth + 1, `${key}/${index}`),
						)}
					</div>
				) : null}
			</div>
		);
	};

	return (
		<div className="ce-explorer">
			<div className="ce-tree" ref={treeRef} tabIndex={0} onKeyDown={onTreeKeyDown}>
				{renderNode(root)}
			</div>

			{menu ? (
				<ContextMenu
					x={menu.x}
					y={menu.y}
					heading={menu.heading}
					groups={menu.groups}
					onSelect={handleMenuSelect}
					onClose={() => setMenu(null)}
				/>
			) : null}
		</div>
	);
}
