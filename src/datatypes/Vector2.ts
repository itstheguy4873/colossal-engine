export class Vector2 {
	constructor(
		public X: number,
		public Y: number
	) {}

	public Add(Other: Vector2): Vector2 {
		return new Vector2(this.X + Other.X, this.Y + Other.Y);
	}

	public Subtract(Other: Vector2): Vector2 {
		return new Vector2(this.X - Other.X, this.Y - Other.Y);
	}

	public Multiply(Other: Vector2 | number): Vector2 {
		if (typeof Other === "number") {
			return new Vector2(this.X * Other, this.Y * Other);
		}

		return new Vector2(this.X * Other.X, this.Y * Other.Y);
	}

	public Divide(Other: Vector2 | number): Vector2 {
		if (typeof Other === "number") {
			return new Vector2(this.X / Other, this.Y / Other);
		}

		return new Vector2(this.X / Other.X, this.Y / Other.Y);
	}
}
