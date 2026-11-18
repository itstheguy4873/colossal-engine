export class UDim {
	constructor(
		public Scale: number,
		public Offset: number,
	) {}

	public static new(Scale: number, Offset: number): UDim {
		return new UDim(Scale, Offset);
	}

	public static fromScale(Scale: number): UDim {
		return new UDim(Scale, 0);
	}

	public static fromOffset(Offset: number): UDim {
		return new UDim(0, Offset);
	}

	public Add(Other: UDim): UDim {
		return new UDim(this.Scale + Other.Scale, this.Offset + Other.Offset);
	}

	public Subtract(Other: UDim): UDim {
		return new UDim(this.Scale - Other.Scale, this.Offset - Other.Offset);
	}
}
