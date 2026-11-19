const clamp = (Value: number): number => Math.min(1, Math.max(0, Value));

/** An RGB colour with channels in the 0-1 range, like Roblox's Color3. */
export class Color3 {
	constructor(
		public R: number,
		public G: number,
		public B: number,
	) {}

	public static fromRGB(R: number, G: number, B: number): Color3 {
		return new Color3(clamp(R / 255), clamp(G / 255), clamp(B / 255));
	}

	public static fromHex(Hex: string): Color3 {
		const Normalized = Hex.replace(/^#/, "");

		if (Normalized.length !== 6) {
			throw new Error(`Invalid hex color: ${Hex}`);
		}

		const Value = Number.parseInt(Normalized, 16);

		if (Number.isNaN(Value)) {
			throw new Error(`Invalid hex color: ${Hex}`);
		}

		return new Color3(
			((Value >> 16) & 0xff) / 255,
			((Value >> 8) & 0xff) / 255,
			(Value & 0xff) / 255,
		);
	}

	public ToHex(): string {
		const Channel = (Value: number): string =>
			Math.round(clamp(Value) * 255)
				.toString(16)
				.padStart(2, "0");

		return `#${Channel(this.R)}${Channel(this.G)}${Channel(this.B)}`;
	}
}
