export interface IRenderer {
	Initialize(): Promise<void>;
	Render(): void;
	RenderUI(): void;
	Dispose(): void;
}
