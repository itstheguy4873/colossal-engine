import { html, type TemplateResult } from "lit";
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

/**
 * One text field that parses a fixed number of values and resets itself when
 * the text is invalid, which keeps every datatype consistent.
 */
const NumberField = (
	format: () => string,
	apply: (values: number[]) => void,
	count: number,
): TemplateResult => html`
	<div class="datatype">
		<input
			type="text"
			.value=${format()}
			@change=${(event: Event) => {
				const input = event.currentTarget as HTMLInputElement;
				const values = ParseNumbers(input.value);

				if (values.length === count && values.every(Number.isFinite)) {
					apply(values);
				} else {
					input.value = format();
				}
			}}
		/>
	</div>
`;

/**
 * Datatype editors used by the Properties panel. There is deliberately no
 * per-type renderer registry: all of them are small enough to live here, and a
 * single `instanceof` chain is easier to follow than six indirections.
 */
export const RenderPropertyValue = (
	value: unknown,
	context: PropertyContext,
): TemplateResult | null => {
	if (value instanceof Vector2) {
		return html`
			<div class="datatype vector2">
				${(["X", "Y"] as const).map(
					(axis) => html`
						<label>
							${axis}
							<input
								type="number"
								.value=${String(value[axis])}
								@change=${(event: Event) =>
									context.setNestedValue(
										[axis],
										Number((event.currentTarget as HTMLInputElement).value),
									)}
							/>
						</label>
					`,
				)}
			</div>
		`;
	}

	if (value instanceof Vector3) {
		return NumberField(
			() => `{${value.X}, ${value.Y}, ${value.Z}}`,
			([x, y, z]) => {
				context.setNestedValue(["X"], x);
				context.setNestedValue(["Y"], y);
				context.setNestedValue(["Z"], z);
			},
			3,
		);
	}

	if (value instanceof CFrame) {
		return NumberField(
			() =>
				`{${value.Position.X}, ${value.Position.Y}, ${value.Position.Z}, ${value.Rotation.X}, ${value.Rotation.Y}, ${value.Rotation.Z}}`,
			([x, y, z, rx, ry, rz]) => {
				context.setNestedValue(["Position", "X"], x);
				context.setNestedValue(["Position", "Y"], y);
				context.setNestedValue(["Position", "Z"], z);
				context.setNestedValue(["Rotation", "X"], rx);
				context.setNestedValue(["Rotation", "Y"], ry);
				context.setNestedValue(["Rotation", "Z"], rz);
			},
			6,
		);
	}

	if (value instanceof Color3) {
		return NumberField(
			() => `{${value.R}, ${value.G}, ${value.B}}`,
			([r, g, b]) => {
				context.setNestedValue(["R"], r);
				context.setNestedValue(["G"], g);
				context.setNestedValue(["B"], b);
			},
			3,
		);
	}

	if (value instanceof UDim) {
		return NumberField(
			() => `{${value.Scale}, ${value.Offset}}`,
			([scale, offset]) => {
				context.setNestedValue(["Scale"], scale);
				context.setNestedValue(["Offset"], offset);
			},
			2,
		);
	}

	if (value instanceof UDim2) {
		return NumberField(
			() => `{{${value.X.Scale}, ${value.X.Offset}}, {${value.Y.Scale}, ${value.Y.Offset}}}`,
			([xScale, xOffset, yScale, yOffset]) => {
				context.setNestedValue(["X", "Scale"], xScale);
				context.setNestedValue(["X", "Offset"], xOffset);
				context.setNestedValue(["Y", "Scale"], yScale);
				context.setNestedValue(["Y", "Offset"], yOffset);
			},
			4,
		);
	}

	return null;
};
