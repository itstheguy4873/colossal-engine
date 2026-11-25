import { CFrame, Engine, Vector3 } from "../../../engine";
import { BaseModule } from "./BaseModule";

const LookSensitivity = 0.0025;
const MoveSpeed = 16;
const FastMoveMultiplier = 3;
/** Leave a little room so the view never flips over the poles. */
const MaxPitch = Math.PI / 2 - 0.01;

const Clamp = (Value: number, Min: number, Max: number): number =>
	Math.min(Math.max(Value, Min), Max);

/**
 * Editor fly camera.
 *
 * Hold the right mouse button and move the pointer to look around. W/S follow
 * the view direction, A/D strafe, Q/E move vertically, and holding Shift
 * multiplies the movement speed.
 */
export class CameraModule extends BaseModule {
	private LastMousePosition: { X: number; Y: number } | null = null;

	constructor(Engine: Engine) {
		super(Engine);
	}

	override Callback = (DeltaTime: number): void => {
		const Workspace = this.Engine.DataModel.GetService("Workspace");
		const UserInputService = this.Engine.DataModel.GetService("UserInputService");
		const Camera = Workspace.CurrentCamera;

		const Rotation = Camera.CFrame.Rotation;
		let Pitch = Rotation.X;
		let Yaw = Rotation.Y;
		let Looked = false;

		// Right-drag look. The first held frame only records the pointer, so the
		// camera does not jump by however far the cursor moved beforehand.
		if (UserInputService.IsMouseButtonDown(2)) {
			const Mouse = UserInputService.GetMousePosition();

			if (this.LastMousePosition) {
				const DeltaX = Mouse.X - this.LastMousePosition.X;
				const DeltaY = Mouse.Y - this.LastMousePosition.Y;

				Yaw -= DeltaX * LookSensitivity;
				Pitch = Clamp(Pitch - DeltaY * LookSensitivity, -MaxPitch, MaxPitch);
				Looked = DeltaX !== 0 || DeltaY !== 0;
			}

			this.LastMousePosition = { X: Mouse.X, Y: Mouse.Y };
		} else {
			this.LastMousePosition = null;
		}

		const CosPitch = Math.cos(Pitch);
		const Forward = new Vector3(
			-Math.sin(Yaw) * CosPitch,
			Math.sin(Pitch),
			-Math.cos(Yaw) * CosPitch,
		);
		const Right = new Vector3(Math.cos(Yaw), 0, -Math.sin(Yaw));
		const Up = new Vector3(0, 1, 0);

		let Direction = new Vector3(0, 0, 0);

		if (UserInputService.IsKeyDown("KeyW")) Direction = Direction.Add(Forward);
		if (UserInputService.IsKeyDown("KeyS")) Direction = Direction.Subtract(Forward);
		if (UserInputService.IsKeyDown("KeyD")) Direction = Direction.Add(Right);
		if (UserInputService.IsKeyDown("KeyA")) Direction = Direction.Subtract(Right);
		if (UserInputService.IsKeyDown("KeyE")) Direction = Direction.Add(Up);
		if (UserInputService.IsKeyDown("KeyQ")) Direction = Direction.Subtract(Up);

		const Length = Math.hypot(Direction.X, Direction.Y, Direction.Z);

		if (Length > 0) {
			const Fast =
				UserInputService.IsKeyDown("ShiftLeft") ||
				UserInputService.IsKeyDown("ShiftRight");
			const Speed = MoveSpeed * (Fast ? FastMoveMultiplier : 1) * DeltaTime;

			Direction = Direction.Divide(Length).Multiply(Speed);
		}

		if (!Looked && Length === 0) return;

		Camera.CFrame = new CFrame(
			Camera.CFrame.Position.Add(Direction),
			new Vector3(Pitch, Yaw, 0),
		);
	};
}
