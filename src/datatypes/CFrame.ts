
import { Vector3 } from "./Vector3";

export class CFrame {
    constructor(
        public Position: Vector3 = new Vector3(0, 0, 0),
        public Rotation: Vector3 = new Vector3(0, 0, 0)
    ) {}

    public Add(Other: CFrame): CFrame {
        return new CFrame(
            this.Position.Add(Other.Position),
            this.Rotation.Add(Other.Rotation)
        );
    }

    public Subtract(Other: CFrame): CFrame {
        return new CFrame(
            this.Position.Subtract(Other.Position),
            this.Rotation.Subtract(Other.Rotation)
        );
    }

    public Multiply(Other: CFrame | number): CFrame {
        if (typeof Other === "number") {
            return new CFrame(
                this.Position.Multiply(Other),
                this.Rotation.Multiply(Other)
            );
        }

        return new CFrame(
            this.Position.Multiply(Other.Position),
            this.Rotation.Multiply(Other.Rotation)
        );
    }

    public Divide(Other: CFrame | number): CFrame {
        if (typeof Other === "number") {
            return new CFrame(
                this.Position.Divide(Other),
                this.Rotation.Divide(Other)
            );
        }

        return new CFrame(
            this.Position.Divide(Other.Position),
            this.Rotation.Divide(Other.Rotation)
        );
    }
}
