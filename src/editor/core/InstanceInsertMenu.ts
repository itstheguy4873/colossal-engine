import { GetCreatableInstances, IsCreatableInstanceA, type Instance } from "../../engine";
import type { ContextMenuGroup, ContextMenuItem } from "../components/ContextMenu";

const ToItem = (className: string): ContextMenuItem => ({
	id: className,
	label: className,
	icon: `/class_icons/${className}.svg`,
});

/**
 * The family a parent expects as children. `null` means there is no specific
 * recommendation, so the menu simply lists every creatable class.
 */
const RecommendedBase = (target: Instance): string | null => {
	if (target.IsA("Workspace")) return "PVInstance";

	// CoreGui and PlayerGui collect ScreenGuis.
	if (target.IsA("CoreGui") || target.IsA("PlayerGui")) return "GuiBase";

	// A ScreenGui (LayerCollector) and GuiObjects hold GuiObjects.
	if (target.IsA("LayerCollector") || target.IsA("GuiObject")) return "GuiObject";

	return null;
};

/**
 * Recommended classes of the parent's expected base family first, then every
 * other creatable class. Nothing is hidden: no parent is restricted.
 */
export const BuildInstanceInsertMenu = (target: Instance): ContextMenuGroup[] => {
	const creatable = GetCreatableInstances();
	const base = RecommendedBase(target);

	const recommended = base
		? creatable.filter((className) => IsCreatableInstanceA(className, base))
		: [];

	const remaining = creatable.filter((className) => !recommended.includes(className));
	const groups: ContextMenuGroup[] = [];

	if (recommended.length > 0) {
		groups.push({
			label: base ? `Recommended · ${base}` : "Recommended",
			items: recommended.map(ToItem),
		});
	}

	if (remaining.length > 0) {
		groups.push({
			label: recommended.length > 0 ? "Other instances" : undefined,
			items: remaining.map(ToItem),
		});
	}

	return groups;
};
