import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { CFrame, Color3, UDim, UDim2, Vector2, Vector3 } from "../../engine";

/**
 * What a datatype editor can do with the property it belongs to.
 */
export interface PropertyContext {
	/** Replace the whole property value. */
	setValue(value: unknown): void;

	/** Update one nested field, e.g. `["Position", "X"]`. */
	setNestedValue(path: string[], value: number): void;
}

const ParseNumbers = (text: string): number[] =>
	(text.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi) ?? []).map(Number);

const CommitKey = (event: KeyboardEvent<HTMLInputElement>, commit: () => void): void => {
	if (event.key === "Enter") {
		event.preventDefault();
		commit();
		event.currentTarget.blur();
	}
};

function NumberInput({ value, onCommit }: { value: number; onCommit(value: number): void }) {
	const [draft, setDraft] = useState(String(value));

	useEffect(() => {
		setDraft(String(value));
	}, [value]);

	const commit = () => {
		const next = Number(draft);

		if (Number.isFinite(next)) {
			onCommit(next);
		} else {
			setDraft(String(value));
		}
	};

	return (
		<input
			type="number"
			value={draft}
			onChange={(event) => setDraft(event.target.value)}
			onBlur={commit}
			onKeyDown={(event) => CommitKey(event, commit)}
		/>
	);
}

/**
 * One text field that parses a fixed number of values and resets itself when
 * the text is invalid, which keeps every datatype consistent.
 */
function NumberField({
	value,
	count,
	apply,
}: {
	value: string;
	count: number;
	apply(values: number[]): void;
}) {
	const [draft, setDraft] = useState(value);

	useEffect(() => {
		setDraft(value);
	}, [value]);

	const commit = () => {
		const values = ParseNumbers(draft);

		if (values.length === count && values.every(Number.isFinite)) {
			apply(values);
		} else {
			setDraft(value);
		}
	};

	return (
		<div className="ce-datatype">
			<input
				type="text"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={commit}
				onKeyDown={(event) => CommitKey(event, commit)}
			/>
		</div>
	);
}

/**
 * Datatype editors used by the Properties panel. There is deliberately no
 * per-type renderer registry: all of them are small enough to live here, and a
 * single `instanceof` chain is easier to follow than six indirections.
 */
export const RenderPropertyValue = (value: unknown, context: PropertyContext): ReactNode | null => {
	if (value instanceof Vector2) {
		return (
			<div className="ce-datatype ce-vector2">
				{(["X", "Y"] as const).map((axis) => (
					<label key={axis}>
						{axis}
						<NumberInput
							value={value[axis]}
							onCommit={(next) => context.setNestedValue([axis], next)}
						/>
					</label>
				))}
			</div>
		);
	}

	if (value instanceof Vector3) {
		return (
			<NumberField
				value={`{${value.X}, ${value.Y}, ${value.Z}}`}
				count={3}
				apply={([x, y, z]) => {
					context.setNestedValue(["X"], x);
					context.setNestedValue(["Y"], y);
					context.setNestedValue(["Z"], z);
				}}
			/>
		);
	}

	if (value instanceof CFrame) {
		return (
			<NumberField
				value={`{${value.Position.X}, ${value.Position.Y}, ${value.Position.Z}, ${value.Rotation.X}, ${value.Rotation.Y}, ${value.Rotation.Z}}`}
				count={6}
				apply={([x, y, z, rx, ry, rz]) => {
					context.setNestedValue(["Position", "X"], x);
					context.setNestedValue(["Position", "Y"], y);
					context.setNestedValue(["Position", "Z"], z);
					context.setNestedValue(["Rotation", "X"], rx);
					context.setNestedValue(["Rotation", "Y"], ry);
					context.setNestedValue(["Rotation", "Z"], rz);
				}}
			/>
		);
	}

	if (value instanceof Color3) {
		return (
			<NumberField
				value={`{${value.R}, ${value.G}, ${value.B}}`}
				count={3}
				apply={([r, g, b]) => {
					context.setNestedValue(["R"], r);
					context.setNestedValue(["G"], g);
					context.setNestedValue(["B"], b);
				}}
			/>
		);
	}

	if (value instanceof UDim) {
		return (
			<NumberField
				value={`{${value.Scale}, ${value.Offset}}`}
				count={2}
				apply={([scale, offset]) => {
					context.setNestedValue(["Scale"], scale);
					context.setNestedValue(["Offset"], offset);
				}}
			/>
		);
	}

	if (value instanceof UDim2) {
		return (
			<NumberField
				value={`{{${value.X.Scale}, ${value.X.Offset}}, {${value.Y.Scale}, ${value.Y.Offset}}}`}
				count={4}
				apply={([xScale, xOffset, yScale, yOffset]) => {
					context.setNestedValue(["X", "Scale"], xScale);
					context.setNestedValue(["X", "Offset"], xOffset);
					context.setNestedValue(["Y", "Scale"], yScale);
					context.setNestedValue(["Y", "Offset"], yOffset);
				}}
			/>
		);
	}

	return null;
};
