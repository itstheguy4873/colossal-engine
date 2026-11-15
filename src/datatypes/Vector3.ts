export class Vector3 {
	constructor(
		public X: number,
		public Y: number,
		public Z: number,
	) {}

	public Add(Other: Vector3): Vector3 {
		return new Vector3(this.X + Other.X, this.Y + Other.Y, this.Z + Other.Z);
	}

	public Subtract(Other: Vector3): Vector3 {
		return new Vector3(this.X - Other.X, this.Y - Other.Y, this.Z - Other.Z);
	}

	public Multiply(Other: Vector3 | number): Vector3 {
		if (typeof Other === "number") {
			return new Vector3(this.X * Other, this.Y * Other, this.Z * Other);
		}

		return new Vector3(this.X * Other.X, this.Y * Other.Y, this.Z * Other.Z);
	}

	public Divide(Other: Vector3 | number): Vector3 {
		if (typeof Other === "number") {
			return new Vector3(this.X / Other, this.Y / Other, this.Z / Other);
		}

		return new Vector3(this.X / Other.X, this.Y / Other.Y, this.Z / Other.Z);
	}
}
