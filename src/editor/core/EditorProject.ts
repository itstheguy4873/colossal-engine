import { CFrame, Color3, DataModel, InstanceFactory, Vector3 } from "../../engine";

// Editor camera tuning: studs per second, a sprint multiplier, radians of turn
// per pixel dragged, and a pitch clamp that keeps the view from flipping over.
const CameraSpeed = 14;
const SprintMultiplier = 3;
const LookSensitivity = 0.0025;
const MaxPitch = Math.PI / 2 - 0.01;

/**
 * An open place: the `DataModel` the editor's widgets share, plus the default
 * contents of the scene.
 *
 * The project owns the data, not the renderer. Panels receive `DataModel` and
 * read from it; only `scene-widget` attaches a backend and starts an `Engine`
 * over it, so stopping the engine no longer throws the scene away.
 *
 * It also drives the editor camera: a free-fly camera over
 * `Workspace.CurrentCamera`. WASD moves, Q/E drops/rises, Shift sprints, and
 * holding the right mouse button turns the view.
 */
export class EditorProject {
	public readonly DataModel: DataModel;

	private Pitch = 0;
	private Yaw = 0;
	private Looking = false;
	private LastMouse = { X: 0, Y: 0 };

	constructor(Name: string = "Colossal Engine") {
		this.DataModel = new DataModel(Name);
		this.BuildScene();
		this.InitializeEditorCamera();
	}

	private BuildScene(): void {
		const Workspace = this.DataModel.GetService("Workspace");

		const Baseplate = InstanceFactory.new("Part");
		Baseplate.Name = "Baseplate";
		Baseplate.Size = new Vector3(30, 1, 30);
		Baseplate.Color = Color3.fromRGB(52, 52, 62);
		Baseplate.Parent = Workspace;

		const Part = InstanceFactory.new("Part");
		Part.Name = "Part";
		Part.Size = new Vector3(4, 4, 4);
		Part.CFrame = new CFrame(new Vector3(0, 2.5, 0), new Vector3(0, 0.4, 0));
		Part.Color = Color3.fromRGB(200, 65, 65);
		Part.Parent = Workspace;

		Workspace.CurrentCamera.CFrame = new CFrame(new Vector3(0, 9, 16), new Vector3(-0.5, 0, 0));
	}

	private InitializeEditorCamera(): void {
		const UserInputService = this.DataModel.GetService("UserInputService");
		const Camera = this.DataModel.GetService("Workspace").CurrentCamera;

		// Pick up the pose BuildScene chose so the first key press does not snap
		// the camera back to the origin.
		this.Pitch = Camera.CFrame.Rotation.X;
		this.Yaw = Camera.CFrame.Rotation.Y;
		this.LastMouse = UserInputService.GetMousePosition();

		UserInputService.InputBegan.Connect((Input, GameProcessedEvent) => {
			// A right-click the GUI consumed is a GUI drag, not a camera drag.
			if (GameProcessedEvent || Input.UserInputType !== "MouseButton2") return;

			this.Looking = true;
			this.LastMouse = UserInputService.GetMousePosition();
		});

		UserInputService.InputEnded.Connect((Input) => {
			if (Input.UserInputType === "MouseButton2") this.Looking = false;
		});

		// Stepped runs before the renderer, so the pose updated here is the one
		// drawn in the same frame.
		this.DataModel.GetService("RunService").Stepped.Connect((_, DeltaTime) => {
			this.StepCamera(DeltaTime);
		});
	}

	private StepCamera(DeltaTime: number): void {
		const UserInputService = this.DataModel.GetService("UserInputService");
		const Camera = this.DataModel.GetService("Workspace").CurrentCamera;
		const Mouse = UserInputService.GetMousePosition();

		let Rotated = false;

		if (this.Looking) {
			const DeltaX = Mouse.X - this.LastMouse.X;
			const DeltaY = Mouse.Y - this.LastMouse.Y;

			if (DeltaX !== 0 || DeltaY !== 0) {
				// Dragging right turns right; dragging down looks down.
				this.Yaw -= DeltaX * LookSensitivity;
				this.Pitch = Math.max(
					-MaxPitch,
					Math.min(MaxPitch, this.Pitch - DeltaY * LookSensitivity),
				);
				Rotated = true;
			}
		}

		this.LastMouse = Mouse;

		const Forward =
			(UserInputService.IsKeyDown("KeyW") ? 1 : 0) -
			(UserInputService.IsKeyDown("KeyS") ? 1 : 0);
		const Strafe =
			(UserInputService.IsKeyDown("KeyD") ? 1 : 0) -
			(UserInputService.IsKeyDown("KeyA") ? 1 : 0);
		const Rise =
			(UserInputService.IsKeyDown("KeyE") ? 1 : 0) -
			(UserInputService.IsKeyDown("KeyQ") ? 1 : 0);

		if (!Forward && !Strafe && !Rise) {
			if (Rotated) {
				Camera.CFrame = new CFrame(
					Camera.CFrame.Position,
					new Vector3(this.Pitch, this.Yaw, 0),
				);
			}

			return;
		}

		const CosPitch = Math.cos(this.Pitch);
		const ViewForward = new Vector3(
			-Math.sin(this.Yaw) * CosPitch,
			Math.sin(this.Pitch),
			-Math.cos(this.Yaw) * CosPitch,
		);
		const ViewRight = new Vector3(Math.cos(this.Yaw), 0, -Math.sin(this.Yaw));
		const WorldUp = new Vector3(0, 1, 0);

		const Direction = ViewForward
			.Multiply(Forward)
			.Add(ViewRight.Multiply(Strafe))
			.Add(WorldUp.Multiply(Rise));

		// Normalize so W+D is no faster than W, then scale by the frame time.
		const Length = Math.hypot(Direction.X, Direction.Y, Direction.Z);
		const Speed =
			CameraSpeed * (UserInputService.IsKeyDown("ShiftLeft") ? SprintMultiplier : 1);
		const Offset = Direction.Divide(Length).Multiply(Speed * DeltaTime);

		Camera.CFrame = new CFrame(
			Camera.CFrame.Position.Add(Offset),
			new Vector3(this.Pitch, this.Yaw, 0),
		);
	}
}
