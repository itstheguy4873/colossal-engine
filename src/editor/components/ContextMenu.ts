import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ApplyIconFallback } from "../core/IconFallback";
import { contextMenuStyles } from "../style";

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

/**
 * A floating menu rendered at a viewport point.
 *
 * It owns its own dismissal (outside pointerdown, Escape, scroll, window blur)
 * and positioning, so the window that opens it only supplies items and reacts
 * to `item-select` / `menu-close`.
 */
@customElement("context-menu")
export class ContextMenu extends LitElement {
	static styles = contextMenuStyles;

	@property({ attribute: false }) public x = 0;

	@property({ attribute: false }) public y = 0;

	@property({ attribute: false }) public heading = "";

	@property({ attribute: false }) public groups: readonly ContextMenuGroup[] = [];

	connectedCallback() {
		super.connectedCallback();

		window.addEventListener("pointerdown", this.onPointerDown, true);
		window.addEventListener("keydown", this.onKeyDown, true);
		window.addEventListener("blur", this.onWindowBlur);
		window.addEventListener("scroll", this.onScroll, true);
	}

	disconnectedCallback() {
		window.removeEventListener("pointerdown", this.onPointerDown, true);
		window.removeEventListener("keydown", this.onKeyDown, true);
		window.removeEventListener("blur", this.onWindowBlur);
		window.removeEventListener("scroll", this.onScroll, true);

		super.disconnectedCallback();
	}

	protected firstUpdated(): void {
		// Keyboard users should be able to pick an item without reaching for the
		// mouse first; arrow-key handling below moves from here.
		this.focusIndex(0);
	}

	protected updated(): void {
		// The requested point is where the cursor was; pull the menu back inside
		// the viewport once its real size is known.
		const rect = this.getBoundingClientRect();
		const maxLeft = window.innerWidth - rect.width - 8;
		const maxTop = window.innerHeight - rect.height - 8;

		this.style.left = `${Math.max(8, Math.min(this.x, maxLeft))}px`;
		this.style.top = `${Math.max(8, Math.min(this.y, maxTop))}px`;
	}

	protected render() {
		return html`
			<div class="menu" role="menu" @contextmenu=${(event: Event) => event.preventDefault()}>
				${this.heading ? html`<div class="heading">${this.heading}</div>` : ""}
				${this.groups.map(
					(group, index) => html`
						${index > 0 ? html`<div class="separator"></div>` : ""}
						${group.label ? html`<div class="group-label">${group.label}</div>` : ""}
						${group.items.map(
							(item) => html`
								<button
									type="button"
									class="item${item.danger ? " danger" : ""}"
									role="menuitem"
									?disabled=${item.disabled}
									@click=${() => this.choose(item.id)}
								>
									${
										item.icon
											? html`
													<img
														class="icon"
														src=${item.icon}
														alt=""
														@error=${ApplyIconFallback}
													/>
												`
											: ""
									}
									<span class="label">${item.label}</span>
								</button>
							`,
						)}
					`,
				)}
			</div>
		`;
	}

	private choose(id: string): void {
		this.dispatchEvent(
			new CustomEvent<ContextMenuSelectDetail>("item-select", {
				detail: { id },
				bubbles: true,
				composed: true,
			}),
		);

		this.close();
	}

	private close(): void {
		this.dispatchEvent(
			new CustomEvent("menu-close", {
				bubbles: true,
				composed: true,
			}),
		);
	}

	private onPointerDown = (event: PointerEvent): void => {
		if (event.composedPath().includes(this)) return;

		this.close();
	};

	private onKeyDown = (event: KeyboardEvent): void => {
		switch (event.key) {
			case "Escape":
				event.preventDefault();
				this.close();
				break;
			case "ArrowDown":
				event.preventDefault();
				this.focusIndex(this.currentIndex() + 1);
				break;
			case "ArrowUp":
				event.preventDefault();
				this.focusIndex(this.currentIndex() - 1);
				break;
			case "Home":
				event.preventDefault();
				this.focusIndex(0);
				break;
			case "End":
				event.preventDefault();
				this.focusIndex(this.enabledItems().length - 1);
				break;
		}
	};

	private enabledItems(): HTMLButtonElement[] {
		return [...this.renderRoot.querySelectorAll<HTMLButtonElement>(".item:not(:disabled)")];
	}

	private currentIndex(): number {
		const active = (this.renderRoot as ShadowRoot).activeElement;
		const items = this.enabledItems();

		return active ? items.indexOf(active as HTMLButtonElement) : -1;
	}

	private focusIndex(index: number): void {
		const items = this.enabledItems();

		if (items.length === 0) return;

		items[(index + items.length) % items.length].focus();
	}

	private onWindowBlur = (): void => {
		this.close();
	};

	private onScroll = (event: Event): void => {
		// A long menu scrolls internally; only page/tree scrolling should close it.
		if (event.composedPath().includes(this)) return;

		this.close();
	};
}
