import { UDim } from "./UDim";

export class UDim2 {
	constructor(
		public X: UDim,
		public Y: UDim,
		public Width: UDim,
		public Height: UDim,
	) {}

	public Add(Other: UDim2): UDim2 {
		return new UDim2(
			this.X.Add(Other.X),
			this.Y.Add(Other.Y),
			this.Width.Add(Other.Width),
			this.Height.Add(Other.Height),
		);
	}

	public Subtract(Other: UDim2): UDim2 {
		return new UDim2(
			this.X.Subtract(Other.X),
			this.Y.Subtract(Other.Y),
			this.Width.Subtract(Other.Width),
			this.Height.Subtract(Other.Height),
		);
	}
}
