import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { BaseWindow } from "./BaseWindow";
import { useSelectedInstance } from "../core/EditorProvider";
import { ApplyIconFallback } from "../core/IconFallback";
import { RenderPropertyValue } from "../components/PropertyRenderer";

export class PropertiesWindow extends BaseWindow {
	public readonly id = "properties";
	public readonly title = "Properties";

	public Render() {
		return <PropertiesView />;
	}
}

const CommitKey = (event: KeyboardEvent<HTMLInputElement>, commit: () => void): void => {
	if (event.key === "Enter") {
		event.preventDefault();
		commit();
		event.currentTarget.blur();
	}
};

function TextPropertyInput({
	value,
	numeric,
	onCommit,
}: {
	value: string | number;
	numeric: boolean;
	onCommit(next: string | number): void;
}) {
	const [draft, setDraft] = useState(String(value));

	useEffect(() => {
		setDraft(String(value));
	}, [value]);

	const commit = () => {
		const next = numeric ? Number(draft) : draft;

		if (numeric && !Number.isFinite(next as number)) {
			setDraft(String(value));
			return;
		}

		onCommit(next);
	};

	return (
		<input
			type={numeric ? "number" : "text"}
			value={draft}
			onChange={(event) => setDraft(event.target.value)}
			onBlur={commit}
			onKeyDown={(event) => CommitKey(event, commit)}
		/>
	);
}

function PropertiesView() {
	const instance = useSelectedInstance();
	const [, setRevision] = useState(0);
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["General"]));

	const refresh = useCallback(() => {
		setRevision((current) => current + 1);
	}, []);

	// The panel edits properties directly, but Explorer renames, scripts, and the
	// engine write them too. Subscribing per property keeps every field in sync.
	useEffect(() => {
		if (!instance || typeof instance.GetPropertyChangedSignal !== "function") return;

		const connections: any[] = [];

		try {
			for (const property of Object.keys(instance)) {
				if (property.startsWith("_")) continue;
				if (typeof instance[property]?.Connect === "function") continue;

				connections.push(instance.GetPropertyChangedSignal(property).Connect(refresh));
			}
		} catch {
			// Instance may have been destroyed.
		}

		return () => {
			for (const connection of connections) {
				connection?.Disconnect?.();
			}
		};
	}, [instance, refresh]);

	const toggleSection = (name: string) => {
		setExpanded((current) => {
			const next = new Set(current);

			if (next.has(name)) {
				next.delete(name);
			} else {
				next.add(name);
			}

			return next;
		});
	};

	const setProperty = (property: string, value: any) => {
		if (!instance) return;

		try {
			instance[property] = value;
			refresh();
		} catch (error) {
			console.error(`Failed to update ${property}:`, error);
		}
	};

	const setNestedProperty = (property: string, path: string[], value: number) => {
		if (!instance) return;

		try {
			let target = instance[property];

			for (let i = 0; i < path.length - 1; i++) {
				target = target[path[i]];
			}

			target[path[path.length - 1]] = value;
			refresh();
		} catch (error) {
			console.error(`Failed to update ${property}:`, error);
		}
	};

	const renderProperty = (name: string, value: any) => {
		// ClassName is a getter-only class identity, not an editable value.
		if (name === "ClassName") {
			return (
				<div className="ce-property" key={name}>
					<label className="ce-property-name">{name}</label>
					<div className="ce-property-value">
						<span className="ce-readonly">{String(value)}</span>
					</div>
				</div>
			);
		}

		const customRenderer = RenderPropertyValue(value, {
			setValue: (next) => setProperty(name, next),
			setNestedValue: (path, next) => setNestedProperty(name, path, next),
		});

		if (customRenderer) {
			return (
				<div className="ce-property" key={name}>
					<label className="ce-property-name">{name}</label>
					<div className="ce-property-value">{customRenderer}</div>
				</div>
			);
		}

		if (typeof value === "boolean") {
			return (
				<div className="ce-property" key={name}>
					<label className="ce-property-name">{name}</label>
					<div className="ce-property-value">
						<input
							type="checkbox"
							checked={value}
							onChange={(event) => setProperty(name, event.target.checked)}
						/>
					</div>
				</div>
			);
		}

		if (typeof value === "number" || typeof value === "string") {
			return (
				<div className="ce-property" key={name}>
					<label className="ce-property-name">{name}</label>
					<div className="ce-property-value">
						<TextPropertyInput
							value={value}
							numeric={typeof value === "number"}
							onCommit={(next) => setProperty(name, next)}
						/>
					</div>
				</div>
			);
		}

		return null;
	};

	const renderSection = (name: string, properties: [string, any][]) => {
		const isExpanded = expanded.has(name);

		return (
			<section className="ce-section" key={name}>
				<div className="ce-section-header" onClick={() => toggleSection(name)}>
					<span className="ce-arrow">{isExpanded ? "▼" : "▶"}</span>
					<span>{name}</span>
				</div>

				{isExpanded ? (
					<div className="ce-section-content">
						{properties.map(([key, value]) => renderProperty(key, value))}
					</div>
				) : null}
			</section>
		);
	};

	if (!instance) {
		return (
			<div className="ce-empty">
				<span>No instance selected</span>
				<small>Select an object in Explorer to view its properties.</small>
			</div>
		);
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

	return (
		<div className="ce-properties">
			<div className="ce-instance-header">
				<img
					src={`/class_icons/${instance.ClassName}.svg`}
					alt=""
					onError={ApplyIconFallback}
				/>

				<div className="ce-instance-info">
					<strong>{instance.Name}</strong>
					<small>{instance.ClassName}</small>
				</div>
			</div>

			{renderSection("General", general)}
			{data.length ? renderSection("Properties", data) : null}
		</div>
	);
}
