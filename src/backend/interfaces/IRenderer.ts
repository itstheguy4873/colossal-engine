export interface IRenderer {
  Initialize(): Promise<void>;
  Render(): void;
  Dispose(): void;
}
