export interface IAudio {
  Initialize(): Promise<void>;

  PlaySound(soundId: string): void;
  StopSound(soundId: string): void;

  Dispose(): void;
}
