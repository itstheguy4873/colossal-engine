import { Signal } from "../datatypes/Signal";

export abstract class Instance {
	public Name: string;

	protected _children: Instance[];
	public static readonly ClassName: string = "Instance";
	/** Marks abstract bases so runtime insert-menu enumeration can skip them. */
	public static readonly Abstract = true;
	private _parent: Instance | null = null;

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
