/**
 * Public, platform-neutral surface of the engine.
 *
 * Apps (the demo entry, the editor) import from here and from `./web` only.
 * Nothing inside `src/engine/` imports this file — the barrels are for
 * consumers, so they cannot create cycles with the internals.
 *
 * Deliberately absent:
 * - `RenderRegistry` / `UIRegistry`: static implementation details. If an app
 *   needs the scene, it walks `Workspace.GetDescendants()`.
 * - Backend implementations: those are platform-specific, see `./web`.
 */

export { Engine } from "./core/Engine";
export { InstanceFactory } from "./core/Factory";

export * from "./classes";

export { CFrame } from "./datatypes/CFrame";
export { Color3 } from "./datatypes/Color3";
export { UDim } from "./datatypes/UDim";
export { UDim2 } from "./datatypes/UDim2";
export { Vector2 } from "./datatypes/Vector2";
export { Vector3 } from "./datatypes/Vector3";
export { Signal, Connection } from "./datatypes/Signal";
export type { ConnectionCallback } from "./datatypes/Signal";

export { PartType } from "./enums/PartType";

export type { IAudio } from "./backend/interfaces/IAudio";
export type { IBackend } from "./backend/interfaces/IBackend";
export type { IGui } from "./backend/interfaces/IGui";
export type { IInput } from "./backend/interfaces/IInput";
export type { IRenderer } from "./backend/interfaces/IRenderer";
