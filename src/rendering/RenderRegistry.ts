import { BasePart } from "../classes/BasePart";
import { Instance } from "../classes/Instance";
import { Workspace } from "../classes/Workspace";
import { CoreGui } from "../classes";
import { Connection } from "../datatypes/Signal";
import { ScreenGui } from "../classes/ScreenGui";

/**
 * Tracks the BaseParts that are currently inside Workspace.
 *
 * Membership is driven by the scene graph (DescendantAdded / DescendantRemoving
 * on Workspace) rather than by construction, so a part only becomes renderable
 * once it is actually parented into Workspace. Initialize is called by Engine
 * after the backend is ready.
 *
 * this also handles ui rendering by:
 *
 * connecting to DescendantAdded and DescendantRemoving in CoreGui for ScreenGui
 * passing the ScreenGui to the renderer so it can render
 */
export class RenderRegistry {
	private static Objects = new Set<BasePart>();
	private static GuiObjects = new Set<ScreenGui>();
	private static Connections: Connection[] = [];
	private static Workspace: Workspace | null = null;
	private static CoreGui: CoreGui | null = null;

	public static Initialize(Workspace: Workspace, CoreGui: CoreGui): void {
		if (this.Workspace === Workspace) return;

		this.Reset();

		this.Workspace = Workspace;

		this.InitializeUI(CoreGui);

		this.Connections.push(
			Workspace.DescendantAdded.Connect((Descendant) => {
				if (Descendant instanceof BasePart) {
					this.Objects.add(Descendant);
				}
			}),
			Workspace.DescendantRemoving.Connect((Descendant) => {
				if (Descendant instanceof BasePart) {
					this.Objects.delete(Descendant);
				}
			}),
		);

		for (const Child of Workspace.GetChildren()) {
			this.AddSubtree(Child);
		}
	}

	private static InitializeUI(CoreGui: CoreGui): void {
		if (this.CoreGui === CoreGui) return;

		this.CoreGui = CoreGui;

		this.Connections.push(
			CoreGui.DescendantAdded.Connect((Descendant) => {
				if (Descendant instanceof ScreenGui) {
					this.GuiObjects.add(Descendant);
				}
			}),
			CoreGui.DescendantRemoving.Connect((Descendant) => {
				if (Descendant instanceof ScreenGui) {
					this.GuiObjects.delete(Descendant);
				}
			}),
		);

		for (const Child of CoreGui.GetChildren()) {
			this.AddSubtree(Child);
		}
	}

	public static Reset(): void {
		for (const Item of this.Connections) {
			Item.Disconnect();
		}

		this.Connections = [];
		this.Objects.clear();
		this.Workspace = null;
	}

	public static GetObjects(): Iterable<BasePart> {
		return this.Objects;
	}

	public static Has(part: BasePart): boolean {
		return this.Objects.has(part);
	}

	public static Unregister(part: BasePart): void {
		this.Objects.delete(part);
	}

	private static AddSubtree(Root: Instance): void {
		if (Root instanceof BasePart) {
			this.Objects.add(Root);
		}

		for (const Descendant of Root.GetDescendants()) {
			if (Descendant instanceof BasePart) {
				this.Objects.add(Descendant);
			}
		}
	}

	public static GetWorkspace(): Workspace | null {
		return this.Workspace;
	}
}
