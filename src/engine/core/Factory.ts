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

let creatableInstances: readonly string[] | null = null;

const HasOwn = (value: object, key: string): boolean =>
	Object.prototype.hasOwnProperty.call(value, key);

/**
 * Concrete, user-creatable classes, derived from the `classes` namespace at
 * runtime.
 *
 * Keeping this derived means adding a class to `classes/index.ts` is enough to
 * make it insertable; there is no second list to forget. A class qualifies
 * when it is a concrete `Instance`, is not a service (services are
 * engine-owned singletons) and is not the `DataModel` root. Abstract bases are
 * skipped via their own `Abstract` marker, so subclasses do not inherit it.
 *
 * The cache is lazy on purpose: `Factory` imports the `classes` namespace, and
 * that namespace is only fully populated after this module has evaluated.
 */
export function GetCreatableInstances(): readonly string[] {
	if (creatableInstances) return creatableInstances;

	const names = Object.entries(Classes)
		.filter(([name, value]) => {
			if (name === "DataModel") return false;
			if (typeof value !== "function") return false;

			const constructor = value as { prototype: object };

			if (HasOwn(constructor, "Abstract")) return false;
			if (!(constructor.prototype instanceof Classes.Instance)) return false;
			if (constructor.prototype instanceof Classes.BaseService) return false;

			return true;
		})
		.map(([name]) => name)
		.sort((a, b) => a.localeCompare(b));

	creatableInstances = Object.freeze(names);

	return creatableInstances;
}

/**
 * Whether a class inherits from `baseClassName`, walking the constructor
 * chain. Insert menus use this to recommend the right family (PVInstance under
 * Workspace, GuiBase under CoreGui, ...) without instantiating anything.
 */
export function IsCreatableInstanceA(className: string, baseClassName: string): boolean {
	let current: unknown = (Classes as Record<string, unknown>)[className];

	while (typeof current === "function" && current !== Function.prototype) {
		if (current.name === baseClassName) return true;

		current = Object.getPrototypeOf(current);
	}

	return false;
}

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

		const instance = new (constructor as new (Name: string) => Classes.Instance)(className);

		if (parent) {
			instance.Parent = parent;
		}

		return instance;
	}
}
