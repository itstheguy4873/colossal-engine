export interface IInput {
  Initialize(): void;

  IsKeyDown(key: string): boolean;
  IsMouseButtonDown(button: number): boolean;

  GetMousePosition(): { X: number; Y: number };

  Dispose(): void;
}
