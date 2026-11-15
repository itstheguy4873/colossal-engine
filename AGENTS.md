# ColossalEngine

Browser 3D game engine with a Roblox-style API, built on Vite + TypeScript + three.js. Single package; no tests or linter. Prettier is configured in `prettier.config.ts` and uses **tabs, double quotes, LF** — run `npm run format` before committing.

## Commands

- `npm run dev` — Vite dev server.
- `npm run typecheck` — `tsc --noEmit`. TypeScript 7; `tsconfig.json` sets `noEmit`, `noUnusedLocals`, and `noUnusedParameters`.
- `npm run build` — typecheck first, then `vite build` into `dist/` (ignored).
- `npm run format` / `npm run format:check` — Prettier over the repo.

No test suite exists — verify changes with `npm run typecheck`, `npm run build`, and `npm run dev` plus the browser console.

## Repository gotchas

- `node_modules/` was committed in the initial commit; it is now untracked and `.gitignore` covers it. Never commit dependencies.
- Everything is LF (`* text=auto eol=lf`). If `git status` shows the whole tree modified, the working copy has CRLF — run `npm run format` instead of committing line-ending churn.
- Indentation is **tabs**, not spaces. Hand-written spaces fail `format:check` and get rewritten by `format`.
- `InstanceFactory.new("X")` and `IsA` resolve classes by name (`Classes[X]`, `constructor.name`). A class must be exported from `classes/index.ts` or `new`/`GetService` throws `Unknown class`. Renaming classes or minifying with name mangling breaks both.
- `DataModel.GetService<T>` defaults `T` to `BaseService`, so `GetService("Workspace")` is typed `BaseService` and property access fails. Always pass the type: `GetService<Workspace>("Workspace")`.

## Layout

- `index.html` → `src/main.ts`; it requires `<main id="app">`. `main.ts` is a demo harness (logs, 1 s top-level wait, a part moved by WASD, camera following it), not engine code.
- `src/classes/` — Roblox-like scene graph and services: `Instance` → `PVInstance` → `BasePart` → `Part`, plus `Camera` (extends `PVInstance`), `DataModel`, `Workspace`, `RunService`, `UserInputService`.
- `src/backend/interfaces/` — `IBackend`, `IRenderer`, `IInput`, `IAudio`; `WebBackend` wires the web implementations.
- `src/core/` — `Engine` lifecycle/rAF loop and `InstanceFactory`.
- `src/datatypes/` — `Vector3`, `CFrame`, `Signal`.
- `src/enums/` — `PartType`.
- `src/rendering/RenderRegistry.ts` — static, three-free registry of renderable parts; also exposes the Workspace handle for the renderer's camera lookup.

## Conventions and invariants

- **three.js is backend-only.** It is imported only under `src/backend/implementations/three/` (`WebRenderer.ts`, `PartGeometry.ts`). Keep it out of `classes/`, `core/`, `datatypes/`, and `rendering/`.
- **PascalCase public API** (`Name`, `Parent`, `Size`, `CFrame`, `GetChildren`, `IsA`, `Heartbeat`). Match Roblox naming and semantics; don't normalize to camelCase.
- **Rendering is ancestry-driven.** A `BasePart` renders only while under `Workspace`, nested containers included. `Engine.Start()` calls `RenderRegistry.Initialize(Workspace)`, which subscribes to `Workspace.DescendantAdded`/`DescendantRemoving`. Never register parts in `InstanceFactory` or constructors — a part has no `Parent` yet at construction, which was a bug.
- `Instance.Parent` is the only hierarchy mutation point. It fires `DescendantRemoving` pre-move on old ancestors, then mutates, then fires `DescendantAdded` on new ancestors for the whole moved subtree, then `ChildRemoved`/`ChildAdded`, then `AncestryChanged`. Preserve that order; listeners rely on `IsDescendantOf` being accurate.
- `RenderRegistry` is static and shared. `Engine.Stop()` resets it; `Initialize` with the same Workspace is a no-op; `GetWorkspace()` is `null` before `Initialize` and after `Reset`.
- **Camera is owned by `Workspace`.** `Workspace.CurrentCamera` is a non-null field initializer that parents a `Camera` in its constructor, so it is never null — don't add null checks. `WebRenderer.syncCamera()` copies `CFrame` and `FieldOfView` into the three camera every frame, so camera behavior belongs in `classes/`, not the backend. `Camera` is not a `BasePart`, so `RenderRegistry` ignores it, and `IsA("PVInstance")` is true (unlike Roblox).
- **Geometry is unit-sized**, cached per `PartType` in `PartGeometry.ts`; size is applied with `mesh.scale = part.Size`. A new `PartType` needs a `CreateGeometry` case.
- `DataModel.GetService("X")` resolves `X` by name from the `classes/index.ts` barrel, constructs it with the service name, and caches it. A new service must be exported there or `GetService` throws `Unknown class`.
- Services are constructed with only `Name` (see `InstanceFactory`). Backend dependencies are injected afterwards with `Attach(...)` from `Engine.Start()`, not constructor arguments.
- **Input state lives only in `WebInput`** (`backend/implementations/three/WebInput.ts`). `UserInputService` is a facade attached by `Engine.Start()`; never add DOM listeners inside `classes/`. Keys are `KeyboardEvent.code` (`"KeyW"`, `"Space"`, `"ShiftLeft"`) — `"w"` never matches. Input is polled from `Heartbeat`/`Stepped`, not pushed.
- `CFrame.Rotation` is Euler radians and is copied directly into `THREE.Mesh.rotation` and `THREE.PerspectiveCamera.rotation`. `CFrame.Multiply` is component-wise, not matrix composition — don't assume Roblox `CFrame` math.

## Frame loop

One `requestAnimationFrame` tick: `RunService.Step(dt)` (fires `Stepped` and `RenderStepped`) → `Renderer.Render()` (`syncCamera` → `syncScene` → draw) → `RunService.PostStep(dt)` (fires `Heartbeat`). Tick rate is therefore display-refresh-bound, and `DeltaTime` is currently unclamped.
