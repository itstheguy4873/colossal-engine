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
- `DataModel.GetService` types itself from the `classes/index.ts` barrel: `GetService("Workspace")` returns `Workspace` with no type argument, and the name is checked against the concrete `BaseService` subclasses exported there. The barrel is therefore load-bearing for types as well as for `InstanceFactory` name lookups. A `GetService<T>("NonBarrelName")` overload still accepts explicit types and dynamic strings.

## Layout

- `index.html` → `src/main.ts`; it requires `<main id="app">`. `main.ts` is a demo harness (logs, 1 s top-level wait, a part moved by WASD, camera following it), not engine code.
- `src/classes/` — Roblox-like scene graph and services: `Instance` → `PVInstance` → `BasePart` → `Part`, plus `Camera` (extends `PVInstance`), `DataModel`, `Workspace`, `RunService`, `UserInputService`.
- `src/classes/` GUI tree (WIP): `GuiBase` → `LayerCollector` → `ScreenGui`, plus the `CoreGui` service. Nothing renders them yet.
- `src/backend/interfaces/` — `IBackend`, `IRenderer`, `IInput`, `IAudio`; `WebBackend` wires the web implementations.
- `src/core/` — `Engine` lifecycle/rAF loop and `InstanceFactory`.
- `src/datatypes/` — `Vector3`, `Vector2`, `CFrame`, `UDim`, `UDim2`, `Signal`.
- `src/enums/` — `PartType`.
- `src/rendering/RenderRegistry.ts` — static, three-free registry of renderable parts and (WIP) `ScreenGui` roots; also exposes the Workspace handle for the renderer's camera lookup.

## Conventions and invariants

- **three.js is backend-only.** It is imported only under `src/backend/implementations/three/` (`WebRenderer.ts`, `PartGeometry.ts`). Keep it out of `classes/`, `core/`, `datatypes/`, and `rendering/`.
- **PascalCase public API** (`Name`, `Parent`, `Size`, `CFrame`, `GetChildren`, `IsA`, `Heartbeat`). Match Roblox naming and semantics; don't normalize to camelCase.
- **Rendering is ancestry-driven.** A `BasePart` renders only while under `Workspace`, nested containers included. `Engine.Start()` calls `RenderRegistry.Initialize(Workspace)`, which subscribes to `Workspace.DescendantAdded`/`DescendantRemoving`. Never register parts in `InstanceFactory` or constructors — a part has no `Parent` yet at construction, which was a bug.
- `Instance.Parent` is the only hierarchy mutation point. It fires `DescendantRemoving` pre-move on old ancestors, then mutates, then fires `DescendantAdded` on new ancestors for the whole moved subtree, then `ChildRemoved`/`ChildAdded`, then `AncestryChanged`. Preserve that order; listeners rely on `IsDescendantOf` being accurate.
- `RenderRegistry` is static and shared. `Engine.Stop()` resets it; `Initialize` with the same Workspace is a no-op; `GetWorkspace()` is `null` before `Initialize` and after `Reset`.
- **GUI is mid-migration; parts and UI currently share one registry by mistake.** `Engine.Start()` calls `Initialize(Workspace)` and then `InitializeUI(CoreGui)`, but `InitializeUI` calls the same `Reset()`, which disconnects part tracking and clears the part set — so the viewport is blank after start. `Reset()` also leaves `GuiObjects`/`CoreGui` populated, so `InitializeUI` early-returns after a Stop/Start cycle and UI never re-subscribes. Fix by splitting part state from GUI state (separate registries, or one `Initialize` that resets once), not by adding guards.
- Only `CoreGui` is exported from `classes/index.ts`. `GuiBase`, `LayerCollector`, and `ScreenGui` are not, so `InstanceFactory.new("ScreenGui")` throws (`Unknown class`) and `GetService` cannot return one; only direct `new ScreenGui(...)` imports work today.
- `UDim2` currently holds four `UDim`s (`X`, `Y`, `Width`, `Height`), which conflates position and size. Roblox's `UDim2` is `{ X, Y }` and is used for both. Nothing reads it yet, so changing it now is free.
- `IRenderer.RenderUI()` exists but `Engine.tick` never calls it, and `WebRenderer.RenderUI()` is a stub that logs an error. Choose the seam before implementing: a separate `IGui`/DOM layer (drop `RenderUI`) or canvas UI inside the renderer (call it from `tick`).
- `GuiBase.Enabled`/`ResetOnSpawn` belong on `LayerCollector` (`ScreenGui`) in Roblox, alongside `DisplayOrder` and `IgnoreGuiInset`. Move them before anything reads them.
- **Camera is owned by `Workspace`.** `Workspace.CurrentCamera` is a non-null field initializer that parents a `Camera` in its constructor, so it is never null — don't add null checks. `WebRenderer.syncCamera()` copies `CFrame` and `FieldOfView` into the three camera every frame, so camera behavior belongs in `classes/`, not the backend. `Camera` is not a `BasePart`, so `RenderRegistry` ignores it, and `IsA("PVInstance")` is true (unlike Roblox).
- **Geometry is unit-sized**, cached per `PartType` in `PartGeometry.ts`; size is applied with `mesh.scale = part.Size`. A new `PartType` needs a `CreateGeometry` case.
- `DataModel.GetService("X")` resolves `X` by name from the `classes/index.ts` barrel, constructs it with the service name, and caches it. A new service must be exported there or `GetService` throws `Unknown class`.
- Services are constructed with only `Name` (see `InstanceFactory`). Backend dependencies are injected afterwards with `Attach(...)` from `Engine.Start()`, not constructor arguments.
- **Input state lives only in `WebInput`** (`backend/implementations/three/WebInput.ts`). `UserInputService` is a facade attached by `Engine.Start()`; never add DOM listeners inside `classes/`. Keys are `KeyboardEvent.code` (`"KeyW"`, `"Space"`, `"ShiftLeft"`) — `"w"` never matches. Input is polled from `Heartbeat`/`Stepped`, not pushed.
- `CFrame.Rotation` is Euler radians and is copied directly into `THREE.Mesh.rotation` and `THREE.PerspectiveCamera.rotation`. `CFrame.Multiply` is component-wise, not matrix composition — don't assume Roblox `CFrame` math.

## Frame loop

One `requestAnimationFrame` tick: `RunService.Step(dt)` (fires `Stepped` and `RenderStepped`) → `Renderer.Render()` (`syncCamera` → `syncScene` → draw) → `RunService.PostStep(dt)` (fires `Heartbeat`). Tick rate is therefore display-refresh-bound, and `DeltaTime` is currently unclamped.
