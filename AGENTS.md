# ColossalEngine

Browser 3D game engine with a Roblox-style API, built on Vite + TypeScript + three.js. Single package; no tests or linter. Prettier is configured in `prettier.config.ts` and uses **tabs, double quotes, LF** — run `npm run format` before committing.

## Commands

- `npm run dev` — Vite dev server.
- `npm run typecheck` — `tsc --noEmit`. TypeScript 7; `tsconfig.json` sets `noEmit`, `noUnusedLocals`, and `noUnusedParameters`.
- `npm run build` — typecheck first, then `vite build` into `dist/` (ignored).
- `npm run format` / `npm run format:check` — Prettier over the repo.
- `npm run licenses` — regenerates `THIRD_PARTY_NOTICES.md` from `package-lock.json` (ignored by Prettier).

No test suite exists — verify changes with `npm run typecheck`, `npm run build`, and `npm run dev` plus the browser console.

## Commits

- **Every commit created by an AI agent must be flagged as AI-authored.** End the commit message with the trailer `AI-Generated: true` (for example, `git commit -m "Add TextButton" -m "AI-Generated: true"`). Human commits omit the trailer. Never present an AI-authored commit as purely human-written, and never strip the trailer when amending.

## Repository gotchas

- `node_modules/` was committed in the initial commit; it is now untracked and `.gitignore` covers it. Never commit dependencies.
- Everything is LF (`* text=auto eol=lf`). If `git status` shows the whole tree modified, the working copy has CRLF — run `npm run format` instead of committing line-ending churn.
- Indentation is **tabs**, not spaces. Hand-written spaces fail `format:check` and get rewritten by `format`.
- `InstanceFactory.new("X")` and `IsA` resolve classes by name (`Classes[X]`, `constructor.name`). A class must be exported from `classes/index.ts` or `new`/`GetService` throws `Unknown class`. Renaming classes or minifying with name mangling breaks both.
- `DataModel.GetService` types itself from the `classes/index.ts` barrel: `GetService("Workspace")` returns `Workspace` with no type argument, and the name is checked against the concrete `BaseService` subclasses exported there. The barrel is therefore load-bearing for types as well as for `InstanceFactory` name lookups. A `GetService<T>("NonBarrelName")` overload still accepts explicit types and dynamic strings.

## Layout

- `index.html` → `src/main.ts`; it requires `<main id="app">`. `main.ts` is a demo harness (logs, 1 s top-level wait, a part moved by WASD, camera following it, and a `ScreenGui` HUD with a `TextBox`, `TextButton`, and a scrolled `ScrollingFrame`), not engine code.
- `src/classes/` — Roblox-like scene graph and services: `Instance` → `PVInstance` → `BasePart` → `Part`, plus `Camera` (extends `PVInstance`), `DataModel`, `Workspace`, `RunService`, `UserInputService`.
- `src/classes/` GUI tree: `GuiBase` → `GuiObject` → `Frame` / `TextLabel` / `TextBox` / `ScrollingFrame`, `GuiObject` → `GuiButton` → `TextButton`, and `GuiBase` → `LayerCollector` → `ScreenGui`. Services `CoreGui` and `PlayerGui` hold the ScreenGui roots.
- `src/backend/interfaces/` — `IBackend` (`Renderer`, `Input`, `Audio`, `Gui`), `IRenderer`, `IInput`, `IAudio`, `IGui`.
- `src/backend/implementations/three/` — `WebBackend`, `WebRenderer`, `WebInput`, `WebAudio`, `WebUi` (the name is historic; it is a DOM overlay, not three.js).
- `src/core/` — `Engine` lifecycle/rAF loop and `InstanceFactory`.
- `src/datatypes/` — `Vector3`, `Vector2`, `Color3`, `CFrame`, `UDim`, `UDim2`, `Signal`.
- `src/enums/` — `PartType`.
- `src/rendering/RenderRegistry.ts` — static, three-free registry of renderable parts; also exposes the Workspace handle for the renderer's camera lookup.
- `src/rendering/UiRegistry.ts` — static, three-free registry of `ScreenGui` roots under `CoreGui`/`PlayerGui`.

## Conventions and invariants

- **three.js is backend-only.** It is imported only under `src/backend/implementations/three/` (`WebRenderer.ts`, `PartGeometry.ts`). Keep it out of `classes/`, `core/`, `datatypes/`, `rendering/`, and `WebUi.ts`.
- **PascalCase public API** (`Name`, `Parent`, `Size`, `CFrame`, `GetChildren`, `IsA`, `Heartbeat`). Match Roblox naming and semantics; don't normalize to camelCase.
- **Rendering is ancestry-driven.** A `BasePart` renders only while under `Workspace`, nested containers included. `Engine.Start()` calls `RenderRegistry.Initialize(Workspace)`, which subscribes to `Workspace.DescendantAdded`/`DescendantRemoving`. Never register parts in `InstanceFactory` or constructors — a part has no `Parent` yet at construction, which was a bug.
- `Instance.Parent` is the only hierarchy mutation point. It fires `DescendantRemoving` pre-move on old ancestors, then mutates, then fires `DescendantAdded` on new ancestors for the whole moved subtree, then `ChildRemoved`/`ChildAdded`, then `AncestryChanged`. Preserve that order; listeners rely on `IsDescendantOf` being accurate.
- **Parts and UI have separate registries.** `RenderRegistry` owns parts and the Workspace handle; `UiRegistry` owns ScreenGui roots. Do not merge them or share a `Reset()`: doing so nulled `Workspace`, which silently disabled `syncCamera()` (blank viewport, frozen camera) while parts still appeared to work.
- `RenderRegistry` is static and shared. `Engine.Stop()` resets it; `Initialize` with the same Workspace is a no-op; `GetWorkspace()` is `null` before `Initialize` and after `Reset`. `WebRenderer.syncCamera()` reads `GetWorkspace()?.CurrentCamera` every frame, so a null Workspace means the three camera never updates.
- **UI is registered by ancestry too.** `Engine.Start()` calls `UiRegistry.Initialize(CoreGui, PlayerGui)`; a `ScreenGui` renders only while it is a descendant of one of those containers, whether it was parented before or after `Start()`. `UiRegistry.GetContainer` walks parents to pick the DOM layer: PlayerGui is z-index 10, CoreGui is 20.
- **Camera is owned by `Workspace`.** `Workspace.CurrentCamera` is a non-null field initializer that parents a `Camera` in its constructor, so it is never null — don't add null checks. `WebRenderer.syncCamera()` copies `CFrame` and `FieldOfView` into the three camera every frame, so camera behavior belongs in `classes/`, not the backend. `Camera` is not a `BasePart`, so `RenderRegistry` ignores it, and `IsA("PVInstance")` is true (unlike Roblox).
- **Geometry is unit-sized**, cached per `PartType` in `PartGeometry.ts`; size is applied with `mesh.scale = part.Size`. A new `PartType` needs a `CreateGeometry` case.
- `DataModel.GetService("X")` resolves `X` by name from the `classes/index.ts` barrel, constructs it with the service name, and caches it. A new service must be exported there or `GetService` throws `Unknown class`.
- Services are constructed with only `Name` (see `InstanceFactory`). Backend dependencies are injected afterwards with `Attach(...)` from `Engine.Start()`, not constructor arguments.
- **Input state lives only in `WebInput`** (`backend/implementations/three/WebInput.ts`). `UserInputService` is a facade attached by `Engine.Start()`; never add DOM listeners inside `classes/`. Keys are `KeyboardEvent.code` (`"KeyW"`, `"Space"`, `"ShiftLeft"`) — `"w"` never matches. Input is polled from `Heartbeat`/`Stepped`, not pushed. `WebInput` ignores `keydown` while an `INPUT`/`TEXTAREA`/`SELECT`/contenteditable is the target (key-up is still recorded so a held key cannot stick), and ignores `mousedown` inside `[data-colossal-ui]`, so typing and clicking GUI never moves parts.
- `CFrame.Rotation` is Euler radians and is copied directly into `THREE.Mesh.rotation` and `THREE.PerspectiveCamera.rotation`. `CFrame.Multiply` is component-wise, not matrix composition — don't assume Roblox `CFrame` math.

## GUI

- **`UDim2` is `{ X, Y }`**, matching Roblox: the same type describes both `Position` and `Size`. Use `UDim2.new(xScale, xOffset, yScale, yOffset)`, `UDim2.fromScale(x, y)`, or `UDim2.fromOffset(x, y)`. Never reintroduce separate width/height fields; `Position` and `Size` would no longer share a type.
- `GuiObject` holds `Position`, `Size`, `AnchorPoint`, `BackgroundColor3`, `BackgroundTransparency`, `BorderSizePixel`, `ClipsDescendants`, `LayoutOrder`, `Rotation`, `Visible`, `ZIndex`. `Frame` adds nothing.
- `TextLabel` and `TextButton` share `Text`, `TextSize`, `TextColor3`, `TextWrapped`, `TextXAlignment`, `TextYAlignment` (the alignment unions live in `TextAlignment.ts`). `GuiButton` adds `AutoButtonColor`, `Modal`, and the signals `Activated`, `MouseButton1Click`, `MouseButton1Down`, `MouseButton1Up`, `MouseEnter`, `MouseLeave`; `TextButton` is its only concrete subclass.
- `TextBox` adds `Text`, `PlaceholderText`, `PlaceholderColor3`, `TextSize`, `TextColor3`, `TextXAlignment`, `ClearTextOnFocus`, `MultiLine`, `TextEditable`, and `TextChanged(Text)` / `Focused` / `FocusLost(EnterPressed)`. There is no `InputObject`, so `FocusLost` takes only the `EnterPressed` boolean.
- `ScrollingFrame` adds `CanvasSize`, `CanvasPosition`, `ScrollBarThickness`, `ScrollingEnabled`, `ScrollBarImageColor3`, `ScrollBarImageTransparency`. Its children live in canvas coordinates, not frame coordinates.
- `LayerCollector` owns `Enabled`, `ResetOnSpawn`, `DisplayOrder`, `IgnoreGuiInset`; `ScreenGui` is the only LayerCollector. Roblox puts these on `ScreenGui`, not on `GuiBase` — keep them there.
- **`WebUi` reconciles every frame.** `Engine.tick` calls `Backend.Gui.Render()` after `Backend.Renderer.Render()`. The renderer walks `UiRegistry.GetRoots()`, creates/removes DOM nodes to match, and writes only styles whose value changed (per-instance style cache). There are no property-change signals yet, so the walk is the update mechanism; `position`/`size` map to CSS `calc(scale% + offsetpx)` and `AnchorPoint` to a `transform: translate(...)`.
- **Text is drawn into a child `<span>`**, never onto the node's own element: `textContent` on a node with children would delete them. The span fills the node (`position:absolute; inset:0`) and maps `TextYAlignment` to `justify-content` of a column flexbox (`align-items: stretch` + `text-align` for X), so wrapped text wraps at the node width instead of overflowing.
- **Interaction is DOM-native and attached once.** `GuiButton`, `TextBox`, and `ScrollingFrame` get `pointer-events: auto`; all other nodes stay `none`. `WebUi.EnsureInteractions` adds listeners the first time a node is rendered (tracked in `interactions`), not per frame. Buttons tint with CSS `filter` (`brightness(0.9)` hover, `0.75` pressed) when `AutoButtonColor` is set, and fire `Activated`/`MouseButton1Click` on `click`. Clicking a button blurs a focused `TextBox` so its `FocusLost` fires before the click, matching Roblox.
- **`TextBox` mounts a real `<input>` / `<textarea>`.** `MultiLine` selects the tag and only a `MultiLine` change recreates it. `Text` is pushed into the control only when it differs from the last value the renderer wrote (`appliedText`), so typing never resets the caret; `input` events pull the value back into `Text` and fire `TextChanged`. Enter in single-line mode blurs the control and reports `FocusLost(true)`. Focus/blur are real browser events — in a document that does not have focus (`document.hasFocus() === false`) programmatic `.focus()` changes `activeElement` without firing them, which only matters for automation.
- **`ScrollingFrame` translates a content `<div>`.** Children are parented into a content element sized from `CanvasSize` and moved with `translate(-CanvasPosition)`. Wheel scrolling is clamped to `CanvasSize - frame size` and writes the clamped value back to `CanvasPosition`; the scrollbar is a track plus thumb whose height and offset come from the same numbers. The thumb is visual only — it cannot be dragged yet.
- Not implemented yet: `ImageLabel`, `ImageButton`, `UIListLayout`, `UIPadding`, `UICorner`, `UIScale`, `TextScaled`, text truncation, `ZIndexBehavior`, `Modal`, scrollbar dragging, drag-to-scroll, `AutomaticCanvasSize`, and TextBox selection/`InputObject` details. ScreenGui `IgnoreGuiInset` is stored but unused.
- The DOM overlay is not part of the canvas, so it is absent from `renderer.domElement.toDataURL()` and any canvas capture.

## Frame loop

One `requestAnimationFrame` tick: `RunService.Step(dt)` (fires `Stepped` and `RenderStepped`) → `Backend.Renderer.Render()` (`syncCamera` → `syncScene` → draw) → `Backend.Gui.Render()` → `RunService.PostStep(dt)` (fires `Heartbeat`). Tick rate is therefore display-refresh-bound, and `DeltaTime` is currently unclamped.
