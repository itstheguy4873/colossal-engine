import { Instance } from "../classes/Instance";
import { ScreenGui } from "../classes/ScreenGui";
import { Connection } from "../datatypes/Signal";

/**
 * Tracks the ScreenGuis that are currently under a UI container (CoreGui,
 * PlayerGui).
 *
 * Like RenderRegistry, membership is ancestry-driven: a ScreenGui is a root
 * only while it is parented under one of the registered containers. The GUI
 * renderer walks GetRoots() every frame, so a ScreenGui added before or after
 * Engine.Start() behaves the same.
 *
 * This is deliberately separate from RenderRegistry: parts and UI have
 * independent lifetimes, and sharing one reset was clearing the Workspace
 * handle that the camera reads.
 */
export class UIRegistry {
	private static Containers = new Set<Instance>();
	private static Roots = new Set<ScreenGui>();
	private static Connections: Connection[] = [];

	public static Initialize(...Containers: Instance[]): void {
		this.Reset();

		for (const Container of Containers) {
			this.Containers.add(Container);

			this.Connections.push(
				Container.DescendantAdded.Connect((Descendant) => {
					if (Descendant instanceof ScreenGui) {
						this.Roots.add(Descendant);
					}
				}),
				Container.DescendantRemoving.Connect((Descendant) => {
					if (Descendant instanceof ScreenGui) {
						this.Roots.delete(Descendant);
					}
				}),
			);

			for (const Child of Container.GetChildren()) {
				this.Collect(Child);
			}
		}
	}

	private static Collect(Root: Instance): void {
		if (Root instanceof ScreenGui) {
			this.Roots.add(Root);
		}

		for (const Descendant of Root.GetDescendants()) {
			if (Descendant instanceof ScreenGui) {
				this.Roots.add(Descendant);
			}
		}
	}

	public static GetRoots(): Iterable<ScreenGui> {
		return this.Roots;
	}

	/** The registered container a ScreenGui is mounted under, or null. */
	public static GetContainer(Root: ScreenGui): Instance | null {
		let Current: Instance | null = Root;

		while (Current) {
			if (this.Containers.has(Current)) {
				return Current;
			}

			Current = Current.Parent;
		}

		return null;
	}

	public static Reset(): void {
		for (const Item of this.Connections) {
			Item.Disconnect();
		}

		this.Connections = [];
		this.Roots.clear();
		this.Containers.clear();
	}
}
