import { IAudio } from '../../interfaces/IAudio';

export class WebAudio implements IAudio {
  public async Initialize(): Promise<void> {
    // TODO: Initialize Web Audio API
  }

  public PlaySound(soundId: string): void {
    // TODO: Play sound
  }

  public StopSound(soundId: string): void {
    // TODO: Stop sound
  }

  public Dispose(): void {
    // TODO: Clean up audio resources
  }
}
