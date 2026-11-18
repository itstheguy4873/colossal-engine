/**
 * Backend contract for 2D UI. The web implementation draws into a DOM layer
 * over the viewport, so it is independent of the 3D renderer.
 */
export interface IGui {
	Initialize(): void;
	Render(): void;
	Dispose(): void;
}
