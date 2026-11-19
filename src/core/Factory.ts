import * as Classes from "../classes";

/**
 * The instance type a constructor produces. Abstract classes are not
 * assignable to a plain `new` signature, so they collapse to `never` here —
 * that is what keeps them out of the name map below.
 */
type Concrete<T> = T extends new (...args: any[]) => infer R ? R : never;

/**
 * Every concrete class exported from `classes/index.ts`, keyed by class name.
 *
 * This mirrors `DataModel`'s `ServiceMap`, but for all Instances rather than
 * just services. Abstract bases (Instance, PVInstance, BasePart, BaseService,
 * GuiBase, LayerCollector, GuiButton) fail `Concrete` and are excluded, so
 * `InstanceFactory.new("BasePart")` is a type error instead of an untyped
 * half-constructed instance.
 */
type InstanceMap = {
	[
		Name in keyof typeof Classes as [Concrete<(typeof Classes)[Name]>] extends [never]
			? never
			: Concrete<(typeof Classes)[Name]> extends Classes.Instance
				? Name
				: never
	]: Concrete<(typeof Classes)[Name]>;
};

type InstanceName = keyof InstanceMap;

export class InstanceFactory {
	/** The class name literal decides the returned type: `new("Part")` is a `Part`. */
	public static new<Name extends InstanceName>(
		className: Name,
		parent?: Classes.Instance | null,
	): InstanceMap[Name];
	public static new(className: InstanceName, parent?: Classes.Instance | null): Classes.Instance {
		return this.Create(className, parent);
	}

	/**
	 * Untyped escape hatch for names that are only known at runtime (services,
	 * loaders). Prefer `new("Literal")`; `Create` returns `Instance`, so the
	 * caller has to narrow or cast the result.
	 */
	public static Create(className: string, parent?: Classes.Instance | null): Classes.Instance {
		const constructor = (Classes as Record<string, unknown>)[className];

		if (typeof constructor !== "function") {
			throw new Error(`Unknown class: ${className}`);
		}

		console.log("Created", className);

		const instance = new (constructor as new (Name: string) => Classes.Instance)(className);

		if (parent) {
			instance.Parent = parent;
		}

		return instance;
	}
}
