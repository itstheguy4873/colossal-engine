# ColossalEngine

Browser 3D game engine with a Roblox-style API, built on Vite + TypeScript + three.js. Single package; no tests, linter, or formatter are configured.

## Commands

- `npm run dev` — Vite dev server (the only npm script).
- `npx tsc --noEmit` — typecheck. TypeScript 7; `tsconfig.json` already sets `noEmit`.
- `npx vite build` — production bundle into `dist/` (ignored).

There is no `npm test`, `npm run lint`, or `npm run build`. Don't invent them. No test suite exists — verify changes with the typecheck/build above and `npm run dev` plus the browser console.

## Repository gotchas

- `node_modules/` was committed in the initial commit. It is now untracked (`git rm -r --cached node_modules`) and `.gitignore` covers it; commit the staged deletion so clones stop carrying dependencies. Don't `git add -A` without checking what it picks up.
- If `git status` shows every source file as modified, the cause is CRLF vs committed LF. Confirm real edits with `git diff --ignore-cr-at-eol`; don't commit line-ending churn.
- `package.json` declares `"type": "commonjs"`, but the source is ESM and only runs through Vite.
- `InstanceFactory.new("Part")` and `IsA` resolve classes by name (`Classes[className]`, `constructor.name`). Renaming classes or enabling minification that drops names breaks them.

## Layout

- `index.html` → `src/main.ts`; it requires `<main id="app">`. `main.ts` is a demo harness (logs, 1 s top-level wait, animated parts), not engine code.
- `src/classes/` — Roblox-like scene graph and services: `Instance` → `PVInstance` → `BasePart` → `Part`, plus `DataModel`, `Workspace`, `RunService`, `UserInputService`.
- `src/backend/interfaces/` — `IBackend`, `IRenderer`, `IInput`, `IAudio`; `WebBackend` wires the web implementations.
- `src/core/` — `Engine` lifecycle/rAF loop and `InstanceFactory`.
- `src/datatypes/` — `Vector3`, `CFrame`, `Signal`.
- `src/rendering/RenderRegistry.ts` — static registry of renderable parts (three-free).

## Conventions and invariants

- **three.js is backend-only.** It is imported only under `src/backend/implementations/three/` (`WebRenderer.ts`, `PartGeometry.ts`). Keep it out of `classes/`, `core/`, `datatypes/`, and `rendering/`.
- **PascalCase public API** (`Name`, `Parent`, `Size`, `CFrame`, `GetChildren`, `IsA`, `Heartbeat`). Match Roblox naming and semantics; don't normalize to camelCase.
- **Rendering is ancestry-driven.** A `BasePart` renders only while under `Workspace`, nested containers included. `Engine.Start()` calls `RenderRegistry.Initialize(Workspace)`, which subscribes to `Workspace.DescendantAdded`/`DescendantRemoving`. Never register parts in `InstanceFactory` or constructors — a part has no `Parent` yet at construction, which was a bug.
- `Instance.Parent` is the only hierarchy mutation point. It fires `DescendantRemoving` pre-move on old ancestors, then mutates, then fires `DescendantAdded` on new ancestors for the whole moved subtree, then `ChildRemoved`/`ChildAdded`, then `AncestryChanged`. Preserve that order; listeners rely on `IsDescendantOf` being accurate.
- `RenderRegistry` is static and shared. `Engine.Stop()` resets it; `Initialize` with the same Workspace is a no-op.
- **Geometry is unit-sized**, cached per `PartType` in `PartGeometry.ts`; size is applied with `mesh.scale = part.Size`. A new `PartType` needs a `CreateGeometry` case.
- `DataModel.GetService("X")` resolves `X` by name from the `classes/index.ts` barrel, constructs it with the service name, and caches it. A new service must be exported there or `GetService` throws `Unknown class`.
- `CFrame.Rotation` is Euler radians and is copied directly into `THREE.Mesh.rotation`. `CFrame.Multiply` is component-wise, not matrix composition — don't assume Roblox `CFrame` math.

## Frame loop

One `requestAnimationFrame` tick: `RunService.Step(dt)` (fires `Stepped` and `RenderStepped`) → `Renderer.Render()` → `RunService.PostStep(dt)` (fires `Heartbeat`). Tick rate is therefore display-refresh-bound, and `DeltaTime` is currently unclamped.
