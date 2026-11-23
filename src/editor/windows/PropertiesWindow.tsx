import { html, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { BaseWindow } from "./BaseWindow";
import { propertiesStyles } from "../style";

import { RenderPropertyValue } from "../components/PropertyRenderer";

@customElement("properties-window")
export class PropertiesWindow extends BaseWindow {
	title = "Properties";

	@state()
	private selected: any = null;

	@state()
	private revision = 0;

	@state()
	private expanded = new Set<string>(["General"]);

	private connections: any[] = [];

	disconnectedCallback() {
		this.context?.removeEventListener("selection-changed", this.handleSelectionChanged);
		this.disconnectAll();
		super.disconnectedCallback();
	}

	connectedCallback() {
		super.connectedCallback();
		this.attachSelectionListener();
	}

	updated(changed: Map<PropertyKey, unknown>) {
		if (changed.has("context")) {
			this.attachSelectionListener();
		}
	}

	private attachSelectionListener() {
		this.context?.removeEventListener("selection-changed", this.handleSelectionChanged);
		this.context?.addEventListener("selection-changed", this.handleSelectionChanged);

		if (this.context?.selectedInstance) {
			this.setSelected(this.context.selectedInstance);
		}
	}

	private disconnectAll() {
		for (const connection of this.connections) {
			connection?.Disconnect?.();
		}

		this.connections = [];
	}

	private subscribe(instance: any) {
		this.disconnectAll();

		if (!instance) return;

		const refresh = () => {
			this.revision++;
		};

		try {
			// Subscribe to property changes if supported.
			const connection = instance.Changed?.Connect(refresh);

			if (connection) {
				this.connections.push(connection);
			}
		} catch {
			// Instance may have been destroyed.
		}
	}

	/**
	 * Call this when the Explorer selection changes.
	 */
	public setSelected(instance: any) {
		this.selected = instance;
		this.subscribe(instance);
		this.revision++;
	}

	private handleSelectionChanged = (event: Event) => {
		const customEvent = event as CustomEvent<{
			instance: any;
		}>;

		this.setSelected(customEvent.detail.instance);
	};

	private toggleSection(name: string) {
		const next = new Set(this.expanded);

		if (next.has(name)) {
			next.delete(name);
		} else {
			next.add(name);
		}

		this.expanded = next;
	}

	private setProperty(property: string, value: any) {
		if (!this.selected) return;

		try {
			this.selected[property] = value;
			this.revision++;
		} catch (error) {
			console.error(`Failed to update ${property}:`, error);
		}
	}

	private setNestedProperty(property: string, path: string[], value: number) {
		if (!this.selected) return;

		try {
			let target = this.selected[property];

			for (let i = 0; i < path.length - 1; i++) {
				target = target[path[i]];
			}

			target[path[path.length - 1]] = value;

			this.revision++;
		} catch (error) {
			console.error(`Failed to update ${property}:`, error);
		}
	}

	private renderProperty(name: string, value: any): TemplateResult {
		// ClassName is a getter-only class identity, not an editable value.
		if (name === "ClassName") {
			return html`
				<div class="property">
					<label class="property-name">${name}</label>
					<div class="property-value">
						<span class="readonly">${String(value)}</span>
					</div>
				</div>
			`;
		}

		const customRenderer = RenderPropertyValue(value, {
			setValue: (next) => this.setProperty(name, next),
			setNestedValue: (path, next) => this.setNestedProperty(name, path, next),
		});

		if (customRenderer) {
			return html`
				<div class="property">
					<label class="property-name">${name}</label>
					<div class="property-value">${customRenderer}</div>
				</div>
			`;
		}

		// Fall back to primitive rendering
		if (typeof value === "boolean") {
			return html`
				<div class="property">
					<label class="property-name">${name}</label>
					<div class="property-value">
						<input
							type="checkbox"
							.checked=${value}
							@change=${(e: Event) =>
								this.setProperty(name, (e.target as HTMLInputElement).checked)}
						/>
					</div>
				</div>
			`;
		}

		if (typeof value === "number" || typeof value === "string") {
			return html`
				<div class="property">
					<label class="property-name">${name}</label>
					<div class="property-value">
						<input
							type=${typeof value === "number" ? "number" : "text"}
							.value=${String(value)}
							@change=${(e: Event) => {
								const input = e.target as HTMLInputElement;
								this.setProperty(
									name,
									typeof value === "number" ? Number(input.value) : input.value,
								);
							}}
						/>
					</div>
				</div>
			`;
		}

		return html``;
	}

	private renderSection(name: string, properties: [string, any][]) {
		const isExpanded = this.expanded.has(name);

		return html`
			<section class="section">
				<div class="section-header" @click=${() => this.toggleSection(name)}>
					<span class="arrow"> ${isExpanded ? "▼" : "▶"} </span>

					<span>${name}</span>
				</div>

				${
					isExpanded
						? html`
								<div class="section-content">
									${properties.map(([key, value]) =>
										this.renderProperty(key, value),
									)}
								</div>
							`
						: ""
				}
			</section>
		`;
	}

	render() {
		void this.revision;

		const instance = this.selected;

		if (!instance) {
			return html`
				<div class="empty">
					<span>No instance selected</span>
					<small>Select an object in Explorer to view its properties.</small>
				</div>
			`;
		}

		const general: [string, any][] = [
			["Name", instance.Name],
			["ClassName", instance.ClassName],
		];

		const data: [string, any][] = [];

		// Display additional enumerable properties.
		try {
			for (const key of Object.keys(instance)) {
				if (key.startsWith("_") || ["Name", "ClassName", "Parent"].includes(key)) {
					continue;
				}

				const value = instance[key];
				const type = typeof value;

				// Signals are event objects, not editable properties.
				if (typeof value?.Connect === "function") {
					continue;
				}

				if (
					type === "string" ||
					type === "number" ||
					type === "boolean" ||
					(type === "object" && value !== null)
				) {
					data.push([key, value]);
				}
			}
		} catch {
			// Instance may have been destroyed.
		}

		return html`
			<div class="properties">
				<div class="instance-header">
					<img src="/class_icons/${instance.ClassName}.svg" alt="" />

					<div class="instance-info">
						<strong>${instance.Name}</strong>
						<small>${instance.ClassName}</small>
					</div>
				</div>

				${this.renderSection("General", general)}
				${data.length ? this.renderSection("Properties", data) : ""}
			</div>
		`;
	}

	static styles = propertiesStyles;
}
