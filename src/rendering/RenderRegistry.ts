import { BasePart } from "../classes/BasePart";
import { Instance } from "../classes/Instance";
import { Workspace } from "../classes/Workspace";
import { Connection } from "../datatypes/Signal";

/**
 * Tracks the BaseParts that are currently inside Workspace.
 *
 * Membership is driven by the scene graph (DescendantAdded / DescendantRemoving
 * on Workspace) rather than by construction, so a part only becomes renderable
 * once it is actually parented into Workspace. Initialize is called by Engine
 * after the backend is ready.
 *
 * UI lives in UiRegistry, not here: sharing one registry meant initializing UI
 * reset the Workspace handle, which left the camera unsynced and the scene
 * empty.
 */
export class RenderRegistry {
	private static Objects = new Set<BasePart>();
	private static Connections: Connection[] = [];
	private static Workspace: Workspace | null = null;

	public static Initialize(Workspace: Workspace): void {
		if (this.Workspace === Workspace) return;

		this.Reset();

		this.Workspace = Workspace;

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
