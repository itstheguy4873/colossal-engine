import type { SyntheticEvent } from "react";

/**
 * Points a broken tree/menu icon at the generic Instance icon. The dataset
 * flag stops a loop when the fallback is missing too.
 */
export const ApplyIconFallback = (event: SyntheticEvent<HTMLImageElement>): void => {
	const image = event.currentTarget;

	if (!(image instanceof HTMLImageElement)) return;
	if (image.dataset.fallback) return;

	image.dataset.fallback = "true";
	image.src = "/class_icons/Instance.svg";
};
