export class UDim {
	constructor(
		public Scale: number,
		public Offset: number,
	) {}

	public Add(Other: UDim): UDim {
		return new UDim(this.Scale + Other.Scale, this.Offset + Other.Offset);
	}

	public Subtract(Other: UDim): UDim {
		return new UDim(this.Scale - Other.Scale, this.Offset - Other.Offset);
	}
}
