import type { Instance } from "../../engine";
import type { ContextMenuGroup } from "../components/ContextMenu";

/**
 * `DataModel` and services are engine-owned: moving, renaming or deleting them
 * would break `DataModel.GetService` and the engine's startup wiring.
 */
export const IsProtectedInstance = (instance: Instance, root: Instance): boolean =>
	instance === root || instance.IsA("BaseService");

/** The rename / move / delete actions shown under the insert suggestions. */
export const BuildInstanceActionMenu = (instance: Instance, root: Instance): ContextMenuGroup => {
	const isProtected = IsProtectedInstance(instance, root);

	return {
		label: "Actions",
		items: [
			{ id: "action:rename", label: "Rename", disabled: isProtected },
			{ id: "action:move", label: "Move to…", disabled: isProtected },
			{
				id: "action:delete",
				label: "Delete",
				danger: true,
				disabled: isProtected,
			},
		],
	};
};

const DepthFrom = (instance: Instance, root: Instance): number => {
	let depth = 0;
	let current: Instance | null = instance;

	while (current && current !== root) {
		depth++;
		current = current.Parent;
	}

	return depth;
};

const IsInside = (instance: Instance, ancestor: Instance): boolean =>
	instance === ancestor || instance.IsDescendantOf(ancestor);

/**
 * Every valid destination for moving `instance`: the whole tree except the
 * instance's own subtree (which would be circular) and its current parent
 * (which would be a no-op).
 */
export const CollectMoveTargets = (instance: Instance, root: Instance): Instance[] => {
	const targets: Instance[] = [];

	const walk = (node: Instance) => {
		if (node !== instance.Parent) {
			targets.push(node);
		}

		for (const child of node.GetChildren()) {
			if (IsInside(child, instance)) continue;

			walk(child);
		}
	};

	walk(root);

	return targets;
};

/**
 * Destination items show tree indentation so nested targets stay readable,
 * and use the same class icons as the Explorer rows.
 */
export const BuildMoveTargetMenu = (
	instance: Instance,
	root: Instance,
): { groups: ContextMenuGroup[]; targets: Instance[] } => {
	const targets = CollectMoveTargets(instance, root);

	return {
		targets,
		groups: [
			{
				label: "Destination",
				items: targets.map((target, index) => ({
					id: `move:${index}`,
					label: `${"\u00A0".repeat(DepthFrom(target, root) * 2)}${target.Name}`,
					icon: `/class_icons/${target.ClassName}.svg`,
				})),
			},
		],
	};
};
