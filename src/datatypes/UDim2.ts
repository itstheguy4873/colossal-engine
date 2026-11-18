import { UDim } from "./UDim";

/**
 * A 2D position or size: X is horizontal, Y is vertical, and each axis holds a
 * scale (fraction of the parent) plus a pixel offset.
 *
 * The same type describes both GuiObject.Position and GuiObject.Size, which is
 * why it has exactly two UDims and not four.
 */
export class UDim2 {
	constructor(
		public X: UDim,
		public Y: UDim,
	) {}

	/** Roblox parity: UDim2.new(xScale, xOffset, yScale, yOffset). */
	public static new(XScale: number, XOffset: number, YScale: number, YOffset: number): UDim2 {
		return new UDim2(new UDim(XScale, XOffset), new UDim(YScale, YOffset));
	}

	public static fromScale(X: number, Y: number): UDim2 {
		return new UDim2(new UDim(X, 0), new UDim(Y, 0));
	}

	public static fromOffset(X: number, Y: number): UDim2 {
		return new UDim2(new UDim(0, X), new UDim(0, Y));
	}

	public Add(Other: UDim2): UDim2 {
		return new UDim2(this.X.Add(Other.X), this.Y.Add(Other.Y));
	}

	public Subtract(Other: UDim2): UDim2 {
		return new UDim2(this.X.Subtract(Other.X), this.Y.Subtract(Other.Y));
	}
}
