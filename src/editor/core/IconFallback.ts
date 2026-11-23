/**
 * Points a broken tree/menu icon at the generic Instance icon. Lit attaches
 * `error` with `addEventListener`, so `image.onerror = null` would not stop a
 * loop when the fallback is missing too; the dataset flag does.
 */
export const ApplyIconFallback = (event: Event): void => {
	const image = event.target;

	if (!(image instanceof HTMLImageElement)) return;
	if (image.dataset.fallback) return;

	image.dataset.fallback = "true";
	image.src = "/class_icons/Instance.svg";
};
