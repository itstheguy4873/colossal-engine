import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ApplyIconFallback } from "../core/IconFallback";

export interface ContextMenuItem {
	id: string;
	label: string;
	icon?: string;
	disabled?: boolean;
	danger?: boolean;
}

export interface ContextMenuGroup {
	label?: string;
	items: readonly ContextMenuItem[];
}

export interface ContextMenuSelectDetail {
	id: string;
}

interface ContextMenuProps {
	x: number;
	y: number;
	heading: string;
	groups: readonly ContextMenuGroup[];
	onSelect(id: string): void;
	onClose(): void;
}

/**
 * A floating menu rendered at a viewport point.
 *
 * It owns dismissal (outside pointerdown, Escape, scroll, window blur) and
 * positioning. The owner supplies items and decides what happens on select; a
 * selected item closes the menu because the owner replaces/clears `groups`.
 */
export function ContextMenu({ x, y, heading, groups, onSelect, onClose }: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef(onClose);
	const selectRef = useRef(onSelect);

	closeRef.current = onClose;
	selectRef.current = onSelect;

	const [position, setPosition] = useState({ left: x, top: y });

	const enabledItems = (): HTMLButtonElement[] =>
		menuRef.current
			? [
					...menuRef.current.querySelectorAll<HTMLButtonElement>(
						".ce-menu-item:not(:disabled)",
					),
				]
			: [];

	const currentIndex = (): number => {
		const active = document.activeElement;
		const items = enabledItems();

		return active ? items.indexOf(active as HTMLButtonElement) : -1;
	};

	const focusIndex = (index: number): void => {
		const items = enabledItems();

		if (items.length === 0) return;

		items[(index + items.length) % items.length].focus();
	};

	useLayoutEffect(() => {
		const menu = menuRef.current;

		if (!menu) return;

		const rect = menu.getBoundingClientRect();
		const maxLeft = window.innerWidth - rect.width - 8;
		const maxTop = window.innerHeight - rect.height - 8;

		setPosition({
			left: Math.max(8, Math.min(x, maxLeft)),
			top: Math.max(8, Math.min(y, maxTop)),
		});
	}, [x, y]);

	useEffect(() => {
		enabledItems()[0]?.focus();
		// Focus only when the menu opens; arrow keys move it afterwards.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const onPointerDown = (event: PointerEvent) => {
			if (menuRef.current && event.composedPath().includes(menuRef.current)) return;

			closeRef.current();
		};

		const onScroll = (event: Event) => {
			if (menuRef.current && event.composedPath().includes(menuRef.current)) return;

			closeRef.current();
		};

		const onWindowBlur = () => closeRef.current();

		const onKeyDown = (event: KeyboardEvent) => {
			switch (event.key) {
				case "Escape":
					event.preventDefault();
					closeRef.current();
					break;
				case "ArrowDown":
					event.preventDefault();
					focusIndex(currentIndex() + 1);
					break;
				case "ArrowUp":
					event.preventDefault();
					focusIndex(currentIndex() - 1);
					break;
				case "Home":
					event.preventDefault();
					focusIndex(0);
					break;
				case "End":
					event.preventDefault();
					focusIndex(enabledItems().length - 1);
					break;
			}
		};

		window.addEventListener("pointerdown", onPointerDown, true);
		window.addEventListener("keydown", onKeyDown, true);
		window.addEventListener("blur", onWindowBlur);
		window.addEventListener("scroll", onScroll, true);

		return () => {
			window.removeEventListener("pointerdown", onPointerDown, true);
			window.removeEventListener("keydown", onKeyDown, true);
			window.removeEventListener("blur", onWindowBlur);
			window.removeEventListener("scroll", onScroll, true);
		};
	}, []);

	const menu = (
		<div
			ref={menuRef}
			className="ce-context-menu"
			role="menu"
			style={{ left: position.left, top: position.top }}
			onContextMenu={(event) => event.preventDefault()}
		>
			{heading ? <div className="ce-menu-heading">{heading}</div> : null}

			{groups.map((group, index) => (
				<div className="ce-menu-group" key={group.label ?? index}>
					{index > 0 ? <div className="ce-menu-separator" /> : null}
					{group.label ? <div className="ce-menu-group-label">{group.label}</div> : null}

					{group.items.map((item) => (
						<button
							key={item.id}
							type="button"
							className={`ce-menu-item${item.danger ? " danger" : ""}`}
							role="menuitem"
							disabled={item.disabled}
							onClick={() => selectRef.current(item.id)}
						>
							{item.icon ? (
								<img
									className="ce-icon"
									src={item.icon}
									alt=""
									onError={ApplyIconFallback}
								/>
							) : null}
							<span className="ce-menu-label">{item.label}</span>
						</button>
					))}
				</div>
			))}
		</div>
	);

	return createPortal(menu, document.body);
}
