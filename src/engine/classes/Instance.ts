import { Signal } from "../datatypes/Signal";

/**
 * Base of every engine object.
 *
 * Instantiable subclasses declare `static readonly Concrete = true`; runtime
 * consumers (the editor insert menus) use that marker to distinguish concrete
 * classes from abstract bases without a second registry.
 */
export abstract class Instance {
	public Name: string;

	protected _children: Instance[];
	public static readonly ClassName: string = "Instance";
	private _parent: Instance | null = null;
	private readonly _propertyChangedSignals = new Map<string, Signal<[]>>();

	public readonly ChildAdded = new Signal<[Child: Instance]>();
	public readonly ChildRemoved = new Signal<[Child: Instance]>();

	public readonly DescendantRemoving = new Signal<[Descendant: Instance]>();
	public readonly DescendantAdded = new Signal<[Descendant: Instance]>();

	public readonly AncestryChanged = new Signal<[Child: Instance, Parent: Instance | null]>();

	constructor(Name: string, Parent: Instance | null = null) {
		this.Name = Name;
		this._children = [];

		this.Parent = Parent;
	}

	public get Parent(): Instance | null {
		return this._parent;
	}

	public set Parent(NewParent: Instance | null) {
		if (NewParent === this || (NewParent && NewParent.IsDescendantOf(this))) {
			throw new Error("Cannot create a circular instance hierarchy.");
		}

		if (NewParent === this._parent) return;

		const OldParent = this._parent;
		const Descendants = [this, ...this.GetDescendants()];

		if (OldParent) {
			for (const Descendant of Descendants) {
				let current: Instance | null = OldParent;

				while (current) {
					current.DescendantRemoving.Fire(Descendant);
					current = current.Parent;
				}
			}

			const Index = OldParent._children.indexOf(this);

			if (Index !== -1) {
				OldParent._children.splice(Index, 1);
			}
		}

		this._parent = NewParent;

		if (NewParent) {
			NewParent._children.push(this);

			for (const Descendant of Descendants) {
				let current: Instance | null = NewParent;

				while (current) {
					current.DescendantAdded.Fire(Descendant);
					current = current.Parent;
				}
			}
		}

		OldParent?.ChildRemoved.Fire(this);
		NewParent?.ChildAdded.Fire(this);

		for (const Descendant of Descendants) {
			Descendant.AncestryChanged.Fire(Descendant, Descendant.Parent);
		}

		this.FirePropertyChanged("Parent");
	}

	/**
	 * Fires whenever `property` is assigned a new value.
	 *
	 * The first subscription instruments the property: the instance's own data
	 * field is replaced with an accessor, so plain `instance.Name = "x"` writes
	 * notify without every class needing a hand-written setter. Properties that
	 * live on the prototype (`Parent`) fire explicitly instead.
	 */
	public GetPropertyChangedSignal(property: string): Signal<[]> {
		let signal = this._propertyChangedSignals.get(property);

		if (!signal) {
			signal = new Signal<[]>();
			this._propertyChangedSignals.set(property, signal);
			this.InstrumentProperty(property);
		}

		return signal;
	}

	/** Notifies listeners that `property` was changed by engine code. */
	protected FirePropertyChanged(property: string): void {
		this._propertyChangedSignals.get(property)?.Fire();
	}

	private InstrumentProperty(property: string): void {
		const descriptor = Object.getOwnPropertyDescriptor(this, property);

		// Only own data fields can be swapped for accessors. Signals and
		// prototype accessors (Parent) are either unchanged or fire explicitly.
		if (!descriptor || !("value" in descriptor) || !descriptor.configurable) return;

		let value = descriptor.value;

		Object.defineProperty(this, property, {
			configurable: true,
			enumerable: descriptor.enumerable,
			get: () => value,
			set: (next: unknown) => {
				if (Object.is(next, value)) return;

				value = next;
				this.FirePropertyChanged(property);
			},
		});
	}

	public abstract get ClassName(): string;

	public GetChildren(): readonly Instance[] {
		return Object.freeze([...this._children]);
	}

	public GetDescendants(): Instance[] {
		const Descendants: Instance[] = [];

		for (const Child of this._children) {
			Descendants.push(Child);
			Descendants.push(...Child.GetDescendants());
		}

		return Descendants;
	}

	public IsA(className: string): boolean {
		let current = this.constructor;

		while (current && current !== Function.prototype) {
			if (current.name === className) {
				return true;
			}

			current = Object.getPrototypeOf(current);
		}

		return false;
	}

	public IsDescendantOf(ancestor: Instance): boolean {
		let current = this.Parent;

		while (current) {
			if (current === ancestor) {
				return true;
			}

			current = current.Parent;
		}

		return false;
	}

	public IsAncestorOf(descendant: Instance): boolean {
		return descendant.IsDescendantOf(this);
	}
}
